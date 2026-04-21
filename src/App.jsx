import { useState } from 'react'

// Import all template images
import base2Img from './images/base2.jpg'
import base3Img from './images/base3.jpg'
import base5Img from './images/base5.jpg'
import base7Img from './images/base7.jpg'
import comboLogo from './images/combo-logo.svg'

function App() {
    // Template definitions - keep only the second row options
    const templates = [
        { id: 'base3', name: 'Template 5 - Discount Alt', image: base3Img },
        { id: 'base2', name: 'Template 6 - Best Price Alt', image: base2Img },
        { id: 'base5', name: 'Template 7 - Top Product Alt', image: base5Img },
        { id: 'base7', name: 'Template 8 - Super Combo Alt', image: base7Img },
    ]

    // State for template selection
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [step, setStep] = useState('select') // 'select' or 'form'

    // State for all 6 form fields
    const [formData, setFormData] = useState({
        field1: '', // Discount percentage
        field2: '', // Product name
        field3: '', // Original price
        field4: '', // Discounted price
        field5: '', // Product code
        field6: ''  // Dimensions
    })

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [csvFile, setCsvFile] = useState(null)
    const [csvData, setCsvData] = useState([])
    const [isBatchMode, setIsBatchMode] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    // Handle template selection
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplate(templateId)
        setStep('form')
    }

    // Handle back to template selection
    const handleBackToSelection = () => {
        setStep('select')
        setSelectedTemplate(null)
    }

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Handle CSV template download
    const handleDownloadTemplate = () => {
        // Helper function to properly escape CSV fields
        const escapeCsvField = (field) => {
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                return `"${field.replace(/"/g, '""')}"`
            }
            return field
        }
        
        // Headers matching the field order: field1, field2, field3, field4, field5, field6
        const headers = [
            'Discount Percentage',  // field1
            'Product Name',         // field2
            'Original Price',        // field3
            'Discounted Price',     // field4
            'Product Code',         // field5
            'Dimensions'            // field6
        ]
        
        // Sample data matching the same order (all price fields use whole numbers, no decimals)
        const sampleData = [
            '40',                                      // field1 - Discount Percentage (whole number, no decimals)
            'ЌЕБЕ СО ДЕЗЕН',                         // field2 - Product Name
            '800',                                     // field3 - Original Price (whole number, no decimals)
            '480',                                     // field4 - Discounted Price (whole number, no decimals)
            '246403',                                 // field5 - Product Code
            'Димензии: 200 cm x 230 cm'               // field6 - Dimensions
        ]
        
        // Properly format CSV with quoted fields
        const csvContent = [
            headers.map(escapeCsvField).join(','),
            sampleData.map(escapeCsvField).join(',')
        ].join('\n')
        
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'price-tag-template.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }

    // Process CSV file content
    const processCsvFile = (file) => {
        if (!file) return
        
        // Validate file type
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setError('Please upload a CSV file')
            return
        }

        setCsvFile(file)
        
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const text = event.target.result
                const rows = text.split('\n').map(row => row.trim()).filter(row => row)
                
                if (rows.length < 2) {
                    setError('CSV file must contain at least a header row and one data row')
                    return
                }
                
                // Parse CSV row properly handling quoted fields
                const parseCsvRow = (row) => {
                    const fields = []
                    let currentField = ''
                    let insideQuotes = false
                    
                    for (let i = 0; i < row.length; i++) {
                        const char = row[i]
                        const nextChar = row[i + 1]
                        
                        if (char === '"') {
                            if (insideQuotes && nextChar === '"') {
                                // Escaped quote
                                currentField += '"'
                                i++ // Skip next quote
                            } else {
                                // Toggle quote state
                                insideQuotes = !insideQuotes
                            }
                        } else if (char === ',' && !insideQuotes) {
                            // Field separator
                            fields.push(currentField.trim())
                            currentField = ''
                        } else {
                            currentField += char
                        }
                    }
                    // Add last field
                    fields.push(currentField.trim())
                    return fields
                }
                
                // Skip header row and parse data rows
                const dataRows = rows.slice(1)
                
                const parsedData = dataRows.map((row, index) => {
                    const fields = parseCsvRow(row)
                    
                    // Process field1 (Discount Percentage) - automatically add % sign if missing
                    let discountPercentage = (fields[0] || '').trim()
                    if (discountPercentage) {
                        // Remove any existing % sign
                        discountPercentage = discountPercentage.replace(/%/g, '').trim()
                        // Check if it's a whole number (no decimals)
                        const numValue = parseFloat(discountPercentage)
                        if (!isNaN(numValue) && Number.isInteger(numValue)) {
                            // Add % sign automatically
                            discountPercentage = numValue.toString() + '%'
                        } else if (!isNaN(numValue)) {
                            // If it has decimals, round to whole number and add %
                            discountPercentage = Math.round(numValue).toString() + '%'
                        }
                    }
                    
                    // Process field3 (Original Price) - automatically add ",-" if missing
                    let originalPrice = (fields[2] || '').trim()
                    if (originalPrice) {
                        // Extract numeric value (parseFloat will ignore non-numeric characters at the end)
                        const numValue = parseFloat(originalPrice)
                        if (!isNaN(numValue)) {
                            // Round to whole number if it has decimals, then add ",-"
                            originalPrice = Math.round(numValue).toString() + ',-'
                        }
                    }
                    
                    // Process field4 (Discounted Price) - automatically add ",-" if missing
                    let discountedPrice = (fields[3] || '').trim()
                    if (discountedPrice) {
                        // Extract numeric value (parseFloat will ignore non-numeric characters at the end)
                        const numValue = parseFloat(discountedPrice)
                        if (!isNaN(numValue)) {
                            // Round to whole number if it has decimals, then add ",-"
                            discountedPrice = Math.round(numValue).toString() + ',-'
                        }
                    }
                    
                    // Map columns to field names (order: field1, field2, field3, field4, field5, field6)
                    return {
                        field1: discountPercentage, // Discount Percentage (with % added automatically)
                        field2: fields[1] || '', // Product Name
                        field3: originalPrice, // Original Price (with ",-" added automatically)
                        field4: discountedPrice, // Discounted Price (with ",-" added automatically)
                        field5: fields[4] || '', // Product Code
                        field6: fields[5] || ''  // Dimensions
                    }
                }).filter(product => {
                    // Filter out completely empty rows
                    return product.field1 || product.field2 || product.field3 || 
                           product.field4 || product.field5 || product.field6
                })
                
                if (parsedData.length === 0) {
                    setError('No valid product data found in CSV file')
                    return
                }
                
                setCsvData(parsedData)
                setIsBatchMode(true)
                setSuccess(false)
                setError(null)
            } catch (err) {
                setError(`Failed to parse CSV file: ${err.message}`)
            }
        }
        
        reader.onerror = () => {
            setError('Failed to read CSV file')
        }
        
        reader.readAsText(file, 'UTF-8')
    }

    // Handle CSV file upload
    const handleCsvUpload = (e) => {
        const file = e.target.files[0]
        processCsvFile(file)
    }

    // Handle drag and drop
    const handleDragOver = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        if (!isBatchMode) {
            const files = Array.from(e.dataTransfer.files)
            const csvFile = files.find(file => file.name.toLowerCase().endsWith('.csv'))
            
            if (csvFile) {
                processCsvFile(csvFile)
            } else {
                setError('Please drop a CSV file')
            }
        }
    }

    // Clear CSV data and return to single mode
    const handleClearCsv = () => {
        setCsvFile(null)
        setCsvData([])
        setIsBatchMode(false)
        setError(null)
        setSuccess(false)
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            // Check if we're in batch mode with CSV data
            if (isBatchMode && csvData.length > 0) {
                // Batch processing for CSV data
                console.log('Batch generating PDFs for', csvData.length, 'products')
                
                const response = await fetch('/api/generate-pdf-batch', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        products: csvData,
                        template: selectedTemplate
                    }),
                })

                if (!response.ok) {
                    throw new Error('Failed to generate batch PDFs')
                }

                // Get the PDF blob
                const blob = await response.blob()

                // Create a download link and trigger download
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `price-tags-batch-${csvData.length}-items.pdf`
                document.body.appendChild(a)
                a.click()

                // Cleanup
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                // Single PDF generation
                console.log('Sending to backend:', { ...formData, template: selectedTemplate })
                
                const response = await fetch('/api/generate-pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...formData,
                        template: selectedTemplate
                    }),
                })

                if (!response.ok) {
                    throw new Error('Failed to generate PDF')
                }

                // Get the PDF blob
                const blob = await response.blob()

                // Create a download link and trigger download
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'generated.pdf'
                document.body.appendChild(a)
                a.click()

                // Cleanup
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)

                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    {step === 'select' ? (
                        <div className="mb-4 flex justify-center">
                            <img 
                                src={comboLogo} 
                                alt="COMBO Logo" 
                                className="h-8 md:h-8 w-auto"
                            />
                        </div>
                    ) : (
                        <h1 className="text-2xl md:text-4xl font-bold leading-snug md:leading-relaxed mb-4" style={{ color: '#E63425' }}>
                            Discount Price Tag Generator
                        </h1>
                    )}
                    <p className="text-slate-600 text-md">
                        {step === 'select' 
                            ? 'Choose a template design for your price tag'
                            : ''
                        }
                    </p>
                </div>

                {/* Step 1: Template Selection */}
                {step === 'select' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        {/* Template Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 justify-items-center">
                            {templates.map((template) => (
                                <div
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template.id)}
                                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105 w-full max-w-[340px] md:max-w-[240px]"
                                >
                                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-slate-200 transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgb(226 232 240)'}>
                                        {/* Template Image */}
                                        <div className="aspect-[3/4] overflow-hidden bg-slate-100">
                                            <img
                                                src={template.image}
                                                alt={template.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {/* Template Name */}
                                        <div className="p-2 py-1 text-center bg-gradient-to-br from-slate-50 to-slate-50 group-hover:bg-red-50 transition-colors">
                                            <div className="block">
                                                {template.name.includes(' - ') ? (
                                                    <>
                                                        <h3 className="font-semibold text-slate-800 text-sm md:text-sm leading-tight">
                                                            {template.name.split(' - ')[0]}
                                                        </h3>
                                                        <p className="text-slate-600 text-xs md:text-xs leading-tight">
                                                            {template.name.split(' - ')[1]}
                                                        </p>
                                                    </>
                                                ) : (
                                                    <h3 className="font-semibold text-slate-800 text-sm md:text-sm leading-tight">
                                                        {template.name}
                                                    </h3>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Form Input */}
                {step === 'form' && (
                    <>
                        {/* Back Button */}
                        <div className="mb-6">
                            <button
                                onClick={handleBackToSelection}
                                className="flex items-center gap-2 text-slate-600 transition-colors font-medium"
                                onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(71 85 105)'}
                            >
                                <i className="fas fa-arrow-left"></i>
                                Back to Template Selection
                            </button>
                        </div>

                        {/* Main Form Card */}
                        <div className="card">
                            {/* Selected Template Preview */}
                            <div className="mb-6 p-4 rounded-xl border-2" style={{ backgroundColor: 'rgba(230, 52, 37, 0.1)', borderColor: 'rgba(230, 52, 37, 0.3)' }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-20 rounded-lg overflow-hidden shadow-md border-2" style={{ borderColor: 'rgba(230, 52, 37, 0.4)' }}>
                                        <img
                                            src={templates.find(t => t.id === selectedTemplate)?.image}
                                            alt="Selected template"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600">Selected Template:</p>
                                        <p className="font-semibold" style={{ color: '#E63425' }}>
                                            {templates.find(t => t.id === selectedTemplate)?.name}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CSV Import Section */}
                            <div className="mb-6 p-6 rounded-xl border-2 border-slate-200 bg-slate-50">
                                <div className="flex items-center gap-2 mb-4">
                                    <i className="fas fa-file-csv text-xl" style={{ color: '#E63425' }}></i>
                                    <h3 className="text-lg font-semibold text-slate-700">Batch Import (CSV)</h3>
                                </div>
                                
                                <p className="text-sm text-slate-600 mb-4">
                                    Generate multiple price tags at once by uploading a CSV file with product data.
                                </p>

                                {/* Drag and Drop Zone */}
                                {!isBatchMode && (
                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`mb-4 p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                                            isDragging
                                                ? 'border-red-400 bg-red-50'
                                                : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="text-center">
                                            <i className={`fas fa-cloud-upload-alt text-4xl mb-2 transition-colors ${
                                                isDragging ? 'text-red-500' : 'text-slate-400'
                                            }`}></i>
                                            <p className={`text-sm font-medium mb-1 transition-colors ${
                                                isDragging ? 'text-red-600' : 'text-slate-700'
                                            }`}>
                                                Drag and drop CSV file here
                                            </p>
                                            <p className="text-xs text-slate-500">or click the button below</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {/* Download Template Button */}
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 text-slate-700 rounded-lg font-medium transition-all hover:border-slate-400 hover:shadow-md"
                                    >
                                        <i className="fas fa-download"></i>
                                        Download CSV Template
                                    </button>

                                    {/* Upload CSV Button */}
                                    {!isBatchMode && (
                                        <label className="flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-medium cursor-pointer transition-all hover:shadow-md"
                                            style={{ 
                                                backgroundColor: '#E63425', 
                                                borderColor: '#E63425',
                                                color: 'white'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = '#c42a1f'
                                                e.currentTarget.style.borderColor = '#c42a1f'
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = '#E63425'
                                                e.currentTarget.style.borderColor = '#E63425'
                                            }}
                                        >
                                            <i className="fas fa-upload"></i>
                                            Import CSV File
                                            <input
                                                type="file"
                                                accept=".csv"
                                                onChange={handleCsvUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}

                                    {/* Clear CSV Button */}
                                    {isBatchMode && (
                                        <button
                                            type="button"
                                            onClick={handleClearCsv}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-600 border-2 border-slate-600 text-white rounded-lg font-medium transition-all hover:bg-slate-700 hover:border-slate-700 hover:shadow-md"
                                        >
                                            <i className="fas fa-times"></i>
                                            Clear CSV
                                        </button>
                                    )}
                                </div>

                                {/* CSV Status Message */}
                                {isBatchMode && csvData.length > 0 && (
                                    <div className="mt-4 p-3 rounded-lg border-2 border-green-200 bg-green-50">
                                        <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
                                            <i className="fas fa-check-circle"></i>
                                            CSV loaded: {csvData.length} product{csvData.length !== 1 ? 's' : ''} ready to generate
                                        </p>
                                    </div>
                                )}
                            </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Input Fields - Hidden when CSV is loaded */}
                        {!isBatchMode && (
                            <>
                        {/* Two Column Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            {/* Left Column - Fields 1, 2, 3 */}
                            <div className="space-y-4 md:space-y-6">
                                {/* Field 1 - Discount Percentage (hidden for Template 2 - base1, Template 3 - base2, Template 5 - base4, Template 6 - base5, Template 7 - base6, and Template 8 - base7) */}
                                {selectedTemplate !== 'base1' && selectedTemplate !== 'base2' && selectedTemplate !== 'base4' && selectedTemplate !== 'base5' && selectedTemplate !== 'base6' && selectedTemplate !== 'base7' && (
                                    <div className="group">
                                        <label htmlFor="field1" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                            <i className="fas fa-tag" style={{ color: '#E63425' }}></i>
                                            Discount Percentage
                                        </label>
                                        <input
                                            type="text"
                                            id="field1"
                                            name="field1"
                                            value={formData.field1}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., 40%"
                                        />
                                    </div>
                                )}

                                {/* Field 2 - Product Name */}
                                <div className="group">
                                        <label htmlFor="field2" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                            <i className="fas fa-box" style={{ color: '#E63425' }}></i>
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        id="field2"
                                        name="field2"
                                        value={formData.field2}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., ЌЕБЕ СО ДЕЗЕН"
                                    />
                                </div>

                                {/* Field 3 - Original Price (hidden for Template 2 - base1, Template 3 - base2, Template 5 - base4, Template 6 - base5, Template 7 - base6, and Template 8 - base7) */}
                                {selectedTemplate !== 'base1' && selectedTemplate !== 'base2' && selectedTemplate !== 'base4' && selectedTemplate !== 'base5' && selectedTemplate !== 'base6' && selectedTemplate !== 'base7' && (
                                    <div className="group">
                                        <label htmlFor="field3" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                            <i className="fas fa-dollar-sign" style={{ color: '#E63425' }}></i>
                                            Original Price (MKD)
                                        </label>
                                        <input
                                            type="text"
                                            id="field3"
                                            name="field3"
                                            value={formData.field3}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., 800,-"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Fields 4, 5, 6 */}
                            <div className="space-y-4 md:space-y-6">
                                {/* Field 4 - Discounted Price */}
                                <div className="group">
                                    <label htmlFor="field4" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                        <i className="fas fa-percent" style={{ color: '#E63425' }}></i>
                                        Discounted Price (MKD)
                                    </label>
                                    <input
                                        type="text"
                                        id="field4"
                                        name="field4"
                                        value={formData.field4}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., 480,-"
                                    />
                                </div>

                                {/* Field 5 - Product Code */}
                                <div className="group">
                                    <label htmlFor="field5" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                        <i className="fas fa-barcode" style={{ color: '#E63425' }}></i>
                                        Product Code
                                    </label>
                                    <input
                                        type="text"
                                        id="field5"
                                        name="field5"
                                        value={formData.field5}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., 246403"
                                    />
                                </div>

                                {/* Field 6 - Dimensions */}
                                <div className="group">
                                    <label htmlFor="field6" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                        <i className="fas fa-ruler-combined" style={{ color: '#E63425' }}></i>
                                        Dimensions
                                    </label>
                                    <input
                                        type="text"
                                        id="field6"
                                        name="field6"
                                        value={formData.field6}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., Димензии: 200 cm x 230 cm"
                                    />
                                </div>
                            </div>
                        </div>
                        </>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg animate-pulse text-center">
                                <p className="font-semibold flex items-center justify-center gap-2">
                                    <i className="fas fa-exclamation-circle"></i>
                                    Error: {error}
                                </p>
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-lg animate-pulse text-center">
                                <p className="font-semibold flex items-center justify-center gap-2">
                                    <i className="fas fa-check-circle"></i>
                                    PDF generated successfully!
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-4 flex justify-center">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn-primary w-full md:w-auto px-12"
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <i className="fas fa-spinner fa-spin"></i>
                                        {isBatchMode ? `Generating ${csvData.length} PDFs...` : 'Generating PDF...'}
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <i className="fas fa-file-pdf"></i>
                                        {isBatchMode ? `Generate ${csvData.length} Price Tag${csvData.length !== 1 ? 's' : ''} PDF` : 'Generate Price Tag PDF'}
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                </>
                )}

                {/* Footer Info */}
                <div className="mt-8 text-center text-sm text-slate-500">
                    <p>
                        Powered by{' '}
                        <a 
                            href="https://oninova.net" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold transition-colors"
                            style={{ color: '#E63425' }}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#c42a1f'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#E63425'}
                        >
                            ONINOVA
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default App

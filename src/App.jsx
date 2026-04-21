import { useState } from 'react'
import { generateBatchPdfBlob, generatePdfBlob } from './pdfGenerator'
import { homePlusHeaderLogo as homePlusLogo, templateCatalog as templates } from './templateAssets'
import { getEditableTemplateLayout, sampleFieldValues } from './templateLayouts'

function App() {
    // State for template selection
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [step, setStep] = useState('select') // 'select' or 'form'

    // State for all editable form fields
    const [formData, setFormData] = useState({
        field1: '', // Discount percentage
        field2: '', // Product name
        field3: '', // Original price
        field4: '', // Discounted price
        field5: '', // Product code
    })

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [csvFile, setCsvFile] = useState(null)
    const [csvData, setCsvData] = useState([])
    const [isBatchMode, setIsBatchMode] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const visibleFieldKeys = new Set(
        (selectedTemplate ? getEditableTemplateLayout(selectedTemplate) : [])
            .filter(item => item.type === 'text' && item.fieldKey)
            .map(item => item.fieldKey)
    )

    const csvTemplateFields = selectedTemplate
        ? getEditableTemplateLayout(selectedTemplate)
            .filter(item => item.type === 'text' && item.fieldKey)
            .map(item => ({
                fieldKey: item.fieldKey,
                label: item.label || item.fieldKey,
            }))
        : []

    const renderTemplatePreview = (template, variant = 'card') => {
        if (!template) {
            return null
        }

        return (
            <div className="relative w-full h-full">
                <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                />
            </div>
        )

        if (template.id === 'base2') {
            const layoutItems = getEditableTemplateLayout(template.id)

            return (
                <div className="relative w-full h-full overflow-hidden bg-[#FEBE10]">
                    {layoutItems.map(item => {
                        const itemStyle = {
                            left: `${item.x * 100}%`,
                            top: `${item.y * 100}%`,
                            width: `${item.w * 100}%`,
                            height: `${item.h * 100}%`,
                        }

                        if (item.type === 'image') {
                            return (
                                <div key={item.id} className="absolute" style={itemStyle}>
                                    <img
                                        src={templateAssetImages[item.assetKey]}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-full w-full object-contain"
                                    />
                                </div>
                            )
                        }

                        const isDiscountItem = item.fieldKey === 'field1'
                        const isOldPriceItem = item.fieldKey === 'field3'
                        const isNewPriceItem = item.fieldKey === 'field4'
                        const textValue = sampleFieldValues[item.fieldKey] || item.label

                        return (
                            <div key={item.id} className="absolute" style={itemStyle}>
                                <div
                                    className={`${fontClassByKey[item.fontKey] || 'font-futura-demi'} h-full w-full ${isDiscountItem ? 'bg-[#ef3b36] text-white' : 'text-[#231f20]'}`}
                                    style={{
                                        fontSize: isDiscountItem ? '82%' : '100%',
                                        lineHeight: `${(item.lineHeight || item.h * 1.1) * 100}%`,
                                        whiteSpace: item.wrap ? 'normal' : 'nowrap',
                                        overflow: 'hidden',
                                        boxSizing: 'border-box',
                                        paddingLeft: isDiscountItem ? '9%' : undefined,
                                        display: isDiscountItem ? 'flex' : undefined,
                                        alignItems: isDiscountItem ? 'center' : undefined,
                                        borderTopLeftRadius: isDiscountItem ? '999px' : undefined,
                                        borderBottomLeftRadius: isDiscountItem ? '999px' : undefined,
                                        borderTopRightRadius: isDiscountItem ? '0px' : undefined,
                                        borderBottomRightRadius: isDiscountItem ? '999px' : undefined,
                                        transform: isOldPriceItem ? 'translateY(6%)' : undefined,
                                        letterSpacing: isNewPriceItem ? '-0.05em' : undefined,
                                    }}
                                >
                                    {textValue}
                                </div>
                                {isOldPriceItem && (
                                    <div className="absolute left-0 top-[40%] h-[7%] w-[118%] -rotate-[13deg] bg-[#ef3b36]"></div>
                                )}
                                {isNewPriceItem && (
                                    <div className="absolute left-[105%] top-[18%] text-[26%] leading-none tracking-[-0.03em] text-[#231f20] font-futura-bold">
                                        ДЕН
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )
        }

        if (template.id === 'base2') {
            const isThumb = variant === 'thumb'

            return (
                <div className="relative w-full h-full overflow-hidden bg-[#FEBE10]">
                    <img
                        src={group231Img}
                        alt=""
                        aria-hidden="true"
                        className={isThumb
                            ? 'absolute left-[7%] top-[5.5%] w-[68%]'
                            : 'absolute left-[6.5%] top-[5.5%] w-[66%]'
                        }
                    />
                    <div className={isThumb
                        ? 'absolute left-[7%] top-[31%] h-[13.5%] w-[40%] bg-[#ef3b36]'
                        : 'absolute left-[6.5%] top-[29%] h-[14%] w-[40%] bg-[#ef3b36]'
                    } style={isThumb
                        ? {
                            borderTopLeftRadius: '999px',
                            borderBottomLeftRadius: '999px',
                            borderTopRightRadius: '0px',
                            borderBottomRightRadius: '999px',
                        }
                        : {
                            borderTopLeftRadius: '999px',
                            borderBottomLeftRadius: '999px',
                            borderTopRightRadius: '0px',
                            borderBottomRightRadius: '999px',
                        }
                    }></div>
                    <div className={isThumb
                        ? 'absolute left-[9.8%] top-[32.5%] text-[16px] leading-none tracking-[-0.04em] text-white font-futura-bold'
                        : 'absolute left-[9.8%] top-[30.8%] text-[44px] leading-none tracking-[-0.04em] text-white font-futura-bold'
                    }>
                        -30%
                    </div>
                    <div className={isThumb
                        ? 'absolute left-[8.5%] top-[45.5%] text-[9px] leading-none tracking-[-0.03em] text-[#231f20] font-futura-demi'
                        : 'absolute left-[8.5%] top-[44%] text-[24px] leading-none tracking-[-0.03em] text-[#231f20] font-futura-demi'
                    }>
                        900,-
                    </div>
                    <div className={isThumb
                        ? 'absolute left-[8.4%] top-[48.8%] h-[1.5px] w-[22%] -rotate-[13deg] bg-[#ef3b36]'
                        : 'absolute left-[8.4%] top-[47.7%] h-[3px] w-[22%] -rotate-[13deg] bg-[#ef3b36]'
                    }></div>
                    <div className={isThumb
                        ? 'absolute left-[6.5%] top-[50.6%] text-[40px] leading-none tracking-[-0.05em] text-[#231f20] font-futura-bold'
                        : 'absolute left-[6%] top-[48.8%] text-[108px] leading-none tracking-[-0.05em] text-[#231f20] font-futura-bold'
                    }>
                        600,-
                    </div>
                    <div className={isThumb
                        ? 'absolute left-[65%] top-[56%] text-[10px] leading-none tracking-[-0.03em] text-[#231f20] font-futura-bold'
                        : 'absolute left-[65%] top-[54.8%] text-[28px] leading-none tracking-[-0.03em] text-[#231f20] font-futura-bold'
                    }>
                        ДЕН
                    </div>
                    {!isThumb && (
                        <>
                            <div className="absolute left-[8%] top-[66.5%] text-[11px] leading-tight text-[#231f20] font-futura-demi">
                                Ѕидни модуларни рафтови x3
                            </div>
                            <div className="absolute left-[8%] top-[71%] text-[10px] leading-tight text-[#231f20] font-futura-demi">
                                90 423 322
                            </div>
                            <img
                                src={template6FooterLogo}
                                alt=""
                                aria-hidden="true"
                                className="absolute left-[8%] top-[82.5%] w-[29%]"
                            />
                        </>
                    )}
                    {isThumb && (
                        <img
                            src={template6FooterLogo}
                            alt=""
                            aria-hidden="true"
                            className="absolute left-[8%] top-[82.5%] w-[29%]"
                        />
                    )}
                </div>
            )
        }

        return (
            <div className="relative w-full h-full">
                <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                />
            </div>
        )
    }

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
        if (!selectedTemplate || csvTemplateFields.length === 0) {
            setError('Select a template first to download its CSV template')
            return
        }

        // Helper function to properly escape CSV fields
        const escapeCsvField = (field) => {
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                return `"${field.replace(/"/g, '""')}"`
            }
            return field
        }
        
        const headers = csvTemplateFields.map(item => item.label)
        
        // Sample data matching the same order (all price fields use whole numbers, no decimals)
        const sampleData = [
            '40',                                      // field1 - Discount Percentage (whole number, no decimals)
            'ЌЕБЕ СО ДЕЗЕН',                         // field2 - Product Name
            '800,-',                                   // field3 - Original Price
            '480,-',                                   // field4 - Discounted Price
            '246403',                                 // field5 - Product Code
            'Димензии: 200 cm x 230 cm'               // field6 - Dimensions
        ]
        sampleData.length = 5

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

    const handleSelectedTemplateCsvDownload = () => {
        if (!selectedTemplate || csvTemplateFields.length === 0) {
            setError('Select a template first to download its CSV template')
            return
        }

        const escapeCsvField = (field) => {
            if (field.includes(',') || field.includes('"') || field.includes('\n')) {
                return `"${field.replace(/"/g, '""')}"`
            }
            return field
        }

        const headers = csvTemplateFields.map(item => item.label)
        const sampleData = csvTemplateFields.map(item => sampleFieldValues[item.fieldKey] || '')
        const csvContent = [
            headers.map(escapeCsvField).join(','),
            sampleData.map(escapeCsvField).join(','),
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
                    
                    // Map columns to field names (order: field1, field2, field3, field4, field5)
                    return {
                        field1: discountPercentage, // Discount Percentage (with % added automatically)
                        field2: fields[1] || '', // Product Name
                        field3: originalPrice, // Original Price (with ",-" added automatically)
                        field4: discountedPrice, // Discounted Price (with ",-" added automatically)
                        field5: fields[4] || '', // Product Code
                    }
                }).filter(product => {
                    // Filter out completely empty rows
                    return product.field1 || product.field2 || product.field3 || 
                           product.field4 || product.field5
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

    const processSelectedTemplateCsvFile = (file) => {
        if (!file) return

        if (!selectedTemplate || csvTemplateFields.length === 0) {
            setError('Select a template first before importing a CSV file')
            return
        }

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

                const parseCsvRow = (row) => {
                    const fields = []
                    let currentField = ''
                    let insideQuotes = false

                    for (let i = 0; i < row.length; i++) {
                        const char = row[i]
                        const nextChar = row[i + 1]

                        if (char === '"') {
                            if (insideQuotes && nextChar === '"') {
                                currentField += '"'
                                i++
                            } else {
                                insideQuotes = !insideQuotes
                            }
                        } else if (char === ',' && !insideQuotes) {
                            fields.push(currentField.trim())
                            currentField = ''
                        } else {
                            currentField += char
                        }
                    }

                    fields.push(currentField.trim())
                    return fields
                }

                const normalizeFieldValue = (fieldKey, rawValue) => {
                    const value = `${rawValue || ''}`.trim()

                    if (!value) {
                        return ''
                    }

                    if (fieldKey === 'field1') {
                        const numericPart = value.replace(/%/g, '').trim()
                        const numValue = parseFloat(numericPart)

                        if (!isNaN(numValue) && Number.isInteger(numValue)) {
                            return `${numValue}%`
                        }

                        if (!isNaN(numValue)) {
                            return `${Math.round(numValue)}%`
                        }
                    }

                    if (fieldKey === 'field3' || fieldKey === 'field4') {
                        const numValue = parseFloat(value)

                        if (!isNaN(numValue)) {
                            return `${Math.round(numValue)},-`
                        }
                    }

                    return value
                }

                const parsedData = rows.slice(1).map((row) => {
                    const fields = parseCsvRow(row)
                    const product = {
                        field1: '',
                        field2: '',
                        field3: '',
                        field4: '',
                        field5: '',
                    }

                    csvTemplateFields.forEach((item, index) => {
                        product[item.fieldKey] = normalizeFieldValue(item.fieldKey, fields[index] || '')
                    })

                    return product
                }).filter(product => (
                    product.field1 || product.field2 || product.field3 || product.field4 || product.field5
                ))

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
        processSelectedTemplateCsvFile(file)
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
                processSelectedTemplateCsvFile(csvFile)
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

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(false)

        try {
            if (isBatchMode && csvData.length > 0) {
                console.log('Batch generating PDFs for', csvData.length, 'products')
                const blob = await generateBatchPdfBlob(csvData, selectedTemplate)
                downloadBlob(blob, `price-tags-batch-${csvData.length}-items.pdf`)

                setSuccess(true)
                setTimeout(() => setSuccess(false), 3000)
            } else {
                console.log('Generating PDF in browser:', { ...formData, template: selectedTemplate })
                const blob = await generatePdfBlob({
                    ...formData,
                    template: selectedTemplate
                })
                downloadBlob(blob, 'generated.pdf')

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
                        <div className="mb-4 flex flex-col items-center gap-3">
                            <img 
                                src={homePlusLogo} 
                                alt="HOME+ Logo" 
                                className="h-10 md:h-12 w-auto"
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
                                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105 w-full max-w-[360px] md:max-w-[255px]"
                                >
                                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-slate-200 transition-all" onMouseEnter={(e) => e.currentTarget.style.borderColor = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgb(226 232 240)'}>
                                        {/* Template Image */}
                                        <div className="aspect-[0.68/1] overflow-hidden bg-slate-100">
                                            {renderTemplatePreview(template, 'card')}
                                        </div>
                                        {/* Template Name */}
                                        <div className="p-2 py-1 text-center bg-gradient-to-br from-slate-50 to-slate-50 group-hover:bg-red-50 transition-colors">
                                            <h3 className="font-semibold text-slate-800 text-sm md:text-sm leading-tight">
                                                {template.name}
                                            </h3>
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
                                        {renderTemplatePreview(templates.find(t => t.id === selectedTemplate), 'thumb')}
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
                                        onClick={handleSelectedTemplateCsvDownload}
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
                                {/* Field 1 - Discount Percentage */}
                                {visibleFieldKeys.has('field1') && (
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
                                {visibleFieldKeys.has('field2') && (
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
                                )}

                                {/* Field 3 - Original Price */}
                                {visibleFieldKeys.has('field3') && (
                                    <div className="group">
                                        <label htmlFor="field3" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                            <i className="fas fa-dollar-sign" style={{ color: '#E63425' }}></i>
                                            Original Price
                                        </label>
                                        <input
                                            type="text"
                                            id="field3"
                                            name="field3"
                                            value={formData.field3}
                                            onChange={handleChange}
                                            className="input-field"
                                            placeholder="e.g., 800"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Right Column - Fields 4, 5, 6 */}
                            <div className="space-y-4 md:space-y-6">
                                {/* Field 4 - Discounted Price */}
                                {visibleFieldKeys.has('field4') && (
                                <div className="group">
                                    <label htmlFor="field4" className="block text-sm font-semibold text-slate-700 mb-2 transition-colors flex items-center gap-2" onMouseEnter={(e) => e.currentTarget.style.color = '#E63425'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgb(51 65 85)'}>
                                        <i className="fas fa-percent" style={{ color: '#E63425' }}></i>
                                        Discounted Price
                                    </label>
                                    <input
                                        type="text"
                                        id="field4"
                                        name="field4"
                                        value={formData.field4}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="e.g., 480"
                                    />
                                </div>
                                )}

                                {/* Field 5 - Product Code */}
                                {visibleFieldKeys.has('field5') && (
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
                                )}

                                {/* Field 6 - Dimensions */}
                                {visibleFieldKeys.has('field6') && (
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
                                )}
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

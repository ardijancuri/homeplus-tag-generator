import express from 'express'
import cors from 'cors'
import { readFile } from 'fs/promises'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { drawTemplate6Page, isTemplate6, prepareTemplate6Assets } from './template-overlays.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.json())

/**
 * PDF Generation Endpoint
 * 
 * This endpoint receives form data with 6 fields and generates a discount price tag PDF
 * by overlaying the text on the base.pdf template.
 * 
 * Fields:
 * 1. Discount percentage (e.g., "40%")
 * 2. Product name (e.g., "КЕБЕ СО ДЕЗЕН")
 * 3. Original price (e.g., "800,-")
 * 4. Discounted price (e.g., "480,-")
 * 5. Product code (e.g., "246403")
 * 6. Dimensions (e.g., "Димензии: 200 cm x 230 cm")
 */
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const formData = req.body
        const selectedTemplate = formData.template || 'base' // Default to 'base' if no template selected

        console.log('📝 Received form data:', formData)
        console.log('🎨 Selected template:', selectedTemplate)

        // Load the selected base PDF template
        const templatePath = join(__dirname, 'templates', `${selectedTemplate}.pdf`)
        console.log('📄 Loading template from:', templatePath)
        const existingPdfBytes = await readFile(templatePath)

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(existingPdfBytes)

        // Register fontkit to enable custom font embedding
        pdfDoc.registerFontkit(fontkit)

        // Load Futura Cyrillic fonts (better support for Cyrillic characters)
        const futuraBookPath = join(__dirname, 'fonts', 'FuturaCyrillicBook.ttf')
        const futuraBoldPath = join(__dirname, 'fonts', 'FuturaCyrillicBold.ttf')
        const futuraDemiPath = join(__dirname, 'fonts', 'FuturaCyrillicDemi.ttf')

        const futuraBookBytes = await readFile(futuraBookPath)
        const futuraBoldBytes = await readFile(futuraBoldPath)
        const futuraDemiBytes = await readFile(futuraDemiPath)

        const regularFont = await pdfDoc.embedFont(futuraBookBytes)
        const boldFont = await pdfDoc.embedFont(futuraBoldBytes)
        const mediumFont = await pdfDoc.embedFont(futuraDemiBytes)

        // Get the first page
        const pages = pdfDoc.getPages()
        const firstPage = pages[0]
        const { width, height } = firstPage.getSize()

        console.log(`PDF dimensions: ${width} x ${height} points`)

        if (isTemplate6(selectedTemplate)) {
            const template6Assets = await prepareTemplate6Assets(pdfDoc)

            drawTemplate6Page({
                page: firstPage,
                formData,
                regularFont,
                boldFont,
                mediumFont,
                assets: template6Assets,
            })

            const pdfBytes = await pdfDoc.save()
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf')
            res.send(Buffer.from(pdfBytes))
            return
        }

        /**
         * FIELD POSITIONS CONFIGURATION FOR EACH TEMPLATE
         * 
         * PDF dimensions: A4 (841.89 x 1190.55 points)
         * Each template has different layout and requires different positioning
         */
        const textColor = rgb(55 / 255, 52 / 255, 53 / 255) // #373435
        
        // Define field positions for each template
        const templateConfigs = {
            // Template 1 (base) - Orange "40% ПОПУСТ" 
            base: [
                { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 520, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: height - 650, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: height - 840, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 260, fontSize: 50, font: mediumFont, color: textColor },
                { x: 80, y: 200, fontSize: 40, font: regularFont, color: textColor },
            ],
            
            // Template 2 (base1) - White/Orange "40% ПОПУСТ"
            base1: [
                { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 560, fontSize: 70, font: mediumFont, color: textColor }, // Product name moved lower
                { x: 80, y: height - 650, fontSize: 120, font: boldFont, color: textColor }, // Original price (not used but kept for consistency)
                { x: 80, y: height - 760, fontSize: 230, font: boldFont, color: textColor }, // Discounted price moved up
                { x: 80, y: 340, fontSize: 64, font: mediumFont, color: textColor }, // Product code moved up
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor }, // Dimensions moved up
            ],
            
            // Template 3 (base2) - Yellow "BEST PRICE"
            base2: [
                { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 620, fontSize: 70, font: mediumFont, color: textColor }, // Product name moved lower
                { x: 80, y: height - 660, fontSize: 120, font: boldFont, color: textColor }, // Original price (not used but kept for consistency)
                { x: 80, y: height - 810, fontSize: 230, font: boldFont, color: textColor }, // Discounted price moved up
                { x: 80, y: 300, fontSize: 64, font: mediumFont, color: textColor }, // Product code moved up
                { x: 80, y: 240, fontSize: 48, font: regularFont, color: textColor }, // Dimensions moved up
            ],
            
            // Template 4 (base3) - Yellow/White "BEST PRICE"
            base3: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) }, // Moved up
                { x: 80, y: height - 460, fontSize: 100, font: mediumFont, color: rgb(1, 1, 1) }, // Moved up, white
                { x: 80, y: height - 600, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) }, // Moved up, white
                { x: 80, y: height - 810, fontSize: 230, font: boldFont, color: rgb(1, 1, 1) }, // Moved up, white
                { x: 80, y: 300, fontSize: 50, font: mediumFont, color: rgb(1, 1, 1) }, // Moved up, white
                { x: 80, y: 240, fontSize: 40, font: regularFont, color: rgb(1, 1, 1) }, // Moved up, white
            ],
            
            // Template 5 (base4) - Orange "40% ПОПУСТ" (alt layout)
            base4: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) }, // Moved up
                { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: textColor }, // Product name moved up
                { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: textColor }, // Original price moved up (not used but kept for consistency)
                { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: textColor }, // Discounted price moved up
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: textColor }, // Product code moved up
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor }, // Dimensions moved up
            ],
            
            // Template 6 (base5) - Green "TOP PRODUCT" (same as Template 8, with white text)
            base5: [
                { x: 170, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) }, // Moved up, white
                { x: 170, y: height - 530, fontSize: 70, font: mediumFont, color: rgb(1, 1, 1) }, // Product name moved up, white
                { x: 170, y: height - 620, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) }, // Original price moved up, white (not used but kept for consistency)
                { x: 170, y: height - 680, fontSize: 180, font: boldFont, color: rgb(1, 1, 1) }, // Discounted price moved up, white
                { x: 170, y: 410, fontSize: 90, font: mediumFont, color: rgb(1, 1, 1) }, // Product code moved up, white
                { x: 170, y: 350, fontSize: 48, font: regularFont, color: rgb(1, 1, 1) }, // Dimensions moved up, white
            ],
            
            // Template 7 (base6) - Green/White "TOP PRODUCT" (same as Template 5)
            base6: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) }, // Moved up
                { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: textColor }, // Product name moved up
                { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: textColor }, // Original price moved up (not used but kept for consistency)
                { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: textColor }, // Discounted price moved up
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: textColor }, // Product code moved up
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor }, // Dimensions moved up
            ],
            
            // Template 8 (base7) - Pink "СУПЕР COMBO" (same as Template 7, but with white text)
            base7: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) }, // Moved up, white
                { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: rgb(1, 1, 1) }, // Product name moved up, white
                { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) }, // Original price moved up, white (not used but kept for consistency)
                { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: rgb(1, 1, 1) }, // Discounted price moved up, white
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: rgb(1, 1, 1) }, // Product code moved up, white
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: rgb(1, 1, 1) }, // Dimensions moved up, white
            ],
        }

        // Get the field positions for the selected template
        const fieldPositions = templateConfigs[selectedTemplate] || templateConfigs.base

        // Draw each field on the PDF
        for (let i = 1; i <= 6; i++) {
            // Skip Field 1 (Discount Percentage) and Field 3 (Original Price) for Template 2 (base1), Template 3 (base2), Template 5 (base4), Template 6 (base5), Template 7 (base6), and Template 8 (base7)
            if ((i === 1 || i === 3) && (selectedTemplate === 'base1' || selectedTemplate === 'base2' || selectedTemplate === 'base4' || selectedTemplate === 'base5' || selectedTemplate === 'base6' || selectedTemplate === 'base7')) {
                continue
            }

            const fieldValue = formData[`field${i}`] || ''
            const position = fieldPositions[i - 1]

            if (fieldValue) {
                firstPage.drawText(fieldValue, {
                    x: position.x,
                    y: position.y,
                    size: position.fontSize,
                    font: position.font,
                    color: position.color, // Use custom color per field
                })

                // Add red strikethrough line for Original Price (Field 3) in Template 1 (base) and Template 4 (base3)
                if (i === 3 && (selectedTemplate === 'base' || selectedTemplate === 'base3')) {
                    // Calculate approximate text width
                    const estimatedTextWidth = position.fontSize * fieldValue.length * 0.5
                    
                    // Calculate line position (middle of text vertically)
                    const lineY = position.y + (position.fontSize * 0.35) // Adjust to center of text
                    const lineStartX = position.x
                    const lineEndX = position.x + estimatedTextWidth
                    
                    // Draw red strikethrough line
                    const strikeColor = rgb(230 / 255, 53 / 255, 39 / 255) // #e63527
                    firstPage.drawLine({
                        start: { x: lineStartX, y: lineY },
                        end: { x: lineEndX, y: lineY },
                        thickness: 6,
                        color: strikeColor,
                    })
                }

                // Add "МКД / MKD" label to the bottom right of price fields (3 and 4)
                if (i === 3 || i === 4) {
                    // Calculate approximate text width based on font size
                    // Rough estimate: fontSize * 0.6 for average character width
                    // For "800,-" or "480,-" with fontSize 120-230, width is approximately 300-600 points
                    const estimatedTextWidth = position.fontSize * fieldValue.length * 0.5
                    
                    // Position label at the right edge of the price text, moved more to the left
                    const labelX = position.x + estimatedTextWidth - 40
                    
                    // Position slightly below the price text (bottom right), moved more up
                    // Adjust based on font size - larger prices need more offset
                    const labelY = position.y - (position.fontSize * 0.1) + 15
                    
                    // Field 4 (discounted price) gets bigger font size than Field 3 (original price)
                    const labelFontSize = i === 4 ? 30 : 14
                    
                    // Use white color for Template 4 (base3), Template 6 (base5), and Template 8 (base7), otherwise use textColor
                    const labelColor = (selectedTemplate === 'base3' || selectedTemplate === 'base5' || selectedTemplate === 'base7') ? rgb(1, 1, 1) : textColor
                    
                    firstPage.drawText('МКД / MKD', {
                        x: labelX,
                        y: labelY,
                        size: labelFontSize,
                        font: boldFont, // Use bold font weight
                        color: labelColor,
                    })
                }
            }
        }

        // Serialize the PDF to bytes
        const pdfBytes = await pdfDoc.save()

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'attachment; filename=generated.pdf')
        res.send(Buffer.from(pdfBytes))

        console.log('✓ PDF price tag generated successfully')

    } catch (error) {
        console.error('Error generating PDF:', error)
        res.status(500).json({
            error: 'Failed to generate PDF',
            message: error.message
        })
    }
})

/**
 * Batch PDF Generation Endpoint
 * 
 * This endpoint receives an array of products from CSV and generates a single PDF
 * with multiple pages, one for each product.
 */
app.post('/api/generate-pdf-batch', async (req, res) => {
    try {
        const { products, template } = req.body
        const selectedTemplate = template || 'base'

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'No products provided' })
        }

        console.log(`📦 Batch generating ${products.length} PDFs using template: ${selectedTemplate}`)

        // Load the base PDF template
        const templatePath = join(__dirname, 'templates', `${selectedTemplate}.pdf`)
        const templateBytes = await readFile(templatePath)

        // Create a new PDF document that will contain all pages
        const finalPdfDoc = await PDFDocument.create()
        finalPdfDoc.registerFontkit(fontkit)

        // Load fonts
        const futuraBookPath = join(__dirname, 'fonts', 'FuturaCyrillicBook.ttf')
        const futuraBoldPath = join(__dirname, 'fonts', 'FuturaCyrillicBold.ttf')
        const futuraDemiPath = join(__dirname, 'fonts', 'FuturaCyrillicDemi.ttf')

        const futuraBookBytes = await readFile(futuraBookPath)
        const futuraBoldBytes = await readFile(futuraBoldPath)
        const futuraDemiBytes = await readFile(futuraDemiPath)

        const regularFont = await finalPdfDoc.embedFont(futuraBookBytes)
        const boldFont = await finalPdfDoc.embedFont(futuraBoldBytes)
        const mediumFont = await finalPdfDoc.embedFont(futuraDemiBytes)
        const template6Assets = isTemplate6(selectedTemplate)
            ? await prepareTemplate6Assets(finalPdfDoc)
            : null

        // Define text color
        const textColor = rgb(55 / 255, 52 / 255, 53 / 255)

        // Load template to get dimensions
        const tempDoc = await PDFDocument.load(templateBytes)
        const tempPage = tempDoc.getPages()[0]
        const { height } = tempPage.getSize()

        // Define field positions for each template
        const templateConfigs = {
            base: [
                { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 520, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: height - 650, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: height - 840, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 260, fontSize: 50, font: mediumFont, color: textColor },
                { x: 80, y: 200, fontSize: 40, font: regularFont, color: textColor },
            ],
            base1: [
                { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 560, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: height - 650, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: height - 760, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 340, fontSize: 64, font: mediumFont, color: textColor },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor },
            ],
            base2: [
                { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 620, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: height - 660, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: height - 810, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 300, fontSize: 64, font: mediumFont, color: textColor },
                { x: 80, y: 240, fontSize: 48, font: regularFont, color: textColor },
            ],
            base3: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 460, fontSize: 100, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 600, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 810, fontSize: 230, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 300, fontSize: 50, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: 240, fontSize: 40, font: regularFont, color: rgb(1, 1, 1) },
            ],
            base4: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: textColor },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor },
            ],
            base5: [
                { x: 170, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 170, y: height - 530, fontSize: 70, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 170, y: height - 620, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) },
                { x: 170, y: height - 680, fontSize: 180, font: boldFont, color: rgb(1, 1, 1) },
                { x: 170, y: 410, fontSize: 90, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 170, y: 350, fontSize: 48, font: regularFont, color: rgb(1, 1, 1) },
            ],
            base6: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: textColor },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor },
            ],
            base7: [
                { x: 80, y: height - 220, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: rgb(1, 1, 1) },
            ],
        }

        const fieldPositions = templateConfigs[selectedTemplate] || templateConfigs.base

        // Process each product
        for (const product of products) {
            // Load template for this page
            const templateDoc = await PDFDocument.load(templateBytes)
            const [templatePage] = await finalPdfDoc.copyPages(templateDoc, [0])

            if (template6Assets) {
                drawTemplate6Page({
                    page: templatePage,
                    formData: product,
                    regularFont,
                    boldFont,
                    mediumFont,
                    assets: template6Assets,
                })

                finalPdfDoc.addPage(templatePage)
                continue
            }

            // Draw each field on the page
            for (let i = 1; i <= 6; i++) {
                // Skip Field 1 and Field 3 for certain templates
                if ((i === 1 || i === 3) && 
                    (selectedTemplate === 'base1' || selectedTemplate === 'base2' || 
                     selectedTemplate === 'base4' || selectedTemplate === 'base5' || 
                     selectedTemplate === 'base6' || selectedTemplate === 'base7')) {
                    continue
                }

                const fieldValue = product[`field${i}`] || ''
                const position = fieldPositions[i - 1]

                if (fieldValue) {
                    templatePage.drawText(fieldValue, {
                        x: position.x,
                        y: position.y,
                        size: position.fontSize,
                        font: position.font,
                        color: position.color,
                    })

                    // Add red strikethrough line for Original Price (Field 3)
                    if (i === 3 && (selectedTemplate === 'base' || selectedTemplate === 'base3')) {
                        const estimatedTextWidth = position.fontSize * fieldValue.length * 0.5
                        const lineY = position.y + (position.fontSize * 0.35)
                        const lineStartX = position.x
                        const lineEndX = position.x + estimatedTextWidth
                        
                        const strikeColor = rgb(230 / 255, 53 / 255, 39 / 255)
                        templatePage.drawLine({
                            start: { x: lineStartX, y: lineY },
                            end: { x: lineEndX, y: lineY },
                            thickness: 6,
                            color: strikeColor,
                        })
                    }

                    // Add "МКД / MKD" label to price fields
                    if (i === 3 || i === 4) {
                        const estimatedTextWidth = position.fontSize * fieldValue.length * 0.5
                        const labelX = position.x + estimatedTextWidth - 40
                        const labelY = position.y - (position.fontSize * 0.1) + 15
                        const labelFontSize = i === 4 ? 30 : 14
                        
                        const labelColor = (selectedTemplate === 'base3' || selectedTemplate === 'base5' || selectedTemplate === 'base7') 
                            ? rgb(1, 1, 1) 
                            : textColor
                        
                        templatePage.drawText('МКД / MKD', {
                            x: labelX,
                            y: labelY,
                            size: labelFontSize,
                            font: boldFont,
                            color: labelColor,
                        })
                    }
                }
            }

            // Add the page to the final document
            finalPdfDoc.addPage(templatePage)
        }

        // Serialize the final PDF
        const finalPdfBytes = await finalPdfDoc.save()

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=price-tags-batch-${products.length}-items.pdf`)
        res.send(Buffer.from(finalPdfBytes))

        console.log(`✓ Batch PDF generated successfully with ${products.length} pages`)

    } catch (error) {
        console.error('Error generating batch PDF:', error)
        res.status(500).json({
            error: 'Failed to generate batch PDF',
            message: error.message
        })
    }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Price Tag Generator Server is running' })
})

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Price Tag Generator Server running on http://localhost:${PORT}`)
    console.log(`📄 Ready to generate discount price tag PDFs`)
    console.log(`\nEndpoints:`)
    console.log(`  POST /api/generate-pdf - Generate single price tag PDF`)
    console.log(`  POST /api/generate-pdf-batch - Generate batch PDFs from CSV data`)
    console.log(`  GET  /api/health - Health check`)
})

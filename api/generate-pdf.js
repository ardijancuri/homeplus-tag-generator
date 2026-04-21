import { readFile } from 'fs/promises'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { drawTemplate6Page, isTemplate6, prepareTemplate6Assets } from '../server/template-overlays.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Vercel Serverless Function for PDF Generation
 * 
 * This function receives form data with 6 fields and generates a discount price tag PDF
 * by overlaying the text on the base.pdf template.
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const formData = req.body
        const selectedTemplate = formData.template || 'base' // Default to 'base' if no template selected

        // Load the selected base PDF template
        const templatePath = join(__dirname, '..', 'server', 'templates', `${selectedTemplate}.pdf`)
        const existingPdfBytes = await readFile(templatePath)

        // Load the PDF document
        const pdfDoc = await PDFDocument.load(existingPdfBytes)

        // Register fontkit to enable custom font embedding
        pdfDoc.registerFontkit(fontkit)

        // Load Futura Cyrillic fonts (better support for Cyrillic characters)
        const futuraBookPath = join(__dirname, '..', 'server', 'fonts', 'FuturaCyrillicBook.ttf')
        const futuraBoldPath = join(__dirname, '..', 'server', 'fonts', 'FuturaCyrillicBold.ttf')
        const futuraDemiPath = join(__dirname, '..', 'server', 'fonts', 'FuturaCyrillicDemi.ttf')

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
                    color: position.color,
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
                    const estimatedTextWidth = position.fontSize * fieldValue.length * 0.5
                    const labelX = position.x + estimatedTextWidth - 40
                    const labelY = position.y - (position.fontSize * 0.1) + 15
                    const labelFontSize = i === 4 ? 30 : 14
                    
                    // Use white color for Template 4 (base3), Template 6 (base5), and Template 8 (base7), otherwise use textColor
                    const labelColor = (selectedTemplate === 'base3' || selectedTemplate === 'base5' || selectedTemplate === 'base7') ? rgb(1, 1, 1) : textColor
                    
                    firstPage.drawText('МКД / MKD', {
                        x: labelX,
                        y: labelY,
                        size: labelFontSize,
                        font: boldFont,
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
}


import { readFile } from 'fs/promises'
import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { drawTemplate6Page, isTemplate6, prepareTemplate6Assets } from '../server/template-overlays.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Vercel Serverless Function for Batch PDF Generation
 * 
 * This function receives an array of products from CSV and generates a single PDF
 * with multiple pages, one for each product.
 */
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        const { products, template } = req.body
        const selectedTemplate = template || 'base'

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: 'No products provided' })
        }

        console.log(`Generating batch PDF for ${products.length} products using template: ${selectedTemplate}`)

        // Load the base PDF template
        const templatePath = join(__dirname, '..', 'server', 'templates', `${selectedTemplate}.pdf`)
        const templateBytes = await readFile(templatePath)

        // Create a new PDF document that will contain all pages
        const finalPdfDoc = await PDFDocument.create()
        finalPdfDoc.registerFontkit(fontkit)

        // Load fonts
        const futuraBookPath = join(__dirname, '..', 'server', 'fonts', 'FuturaCyrillicBook.ttf')
        const futuraBoldPath = join(__dirname, '..', 'server', 'fonts', 'FuturaCyrillicBold.ttf')
        const futuraDemiPath = join(__dirname, '..', 'server', 'fonts', 'FuturaCyrillicDemi.ttf')

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
        const textColor = rgb(55 / 255, 52 / 255, 53 / 255) // #373435

        // Define field positions for each template (same as in generate-pdf.js)
        const templateConfigs = {
            base: [
                { x: 80, y: 940, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 670, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: 540, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: 350, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 260, fontSize: 50, font: mediumFont, color: textColor },
                { x: 80, y: 200, fontSize: 40, font: regularFont, color: textColor },
            ],
            base1: [
                { x: 80, y: 940, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 630, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: 540, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: 430, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 340, fontSize: 64, font: mediumFont, color: textColor },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor },
            ],
            base2: [
                { x: 80, y: 940, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 570, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: 530, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: 380, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 300, fontSize: 64, font: mediumFont, color: textColor },
                { x: 80, y: 240, fontSize: 48, font: regularFont, color: textColor },
            ],
            base3: [
                { x: 80, y: 970, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 730, fontSize: 100, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: 590, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 380, fontSize: 230, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 300, fontSize: 50, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: 240, fontSize: 40, font: regularFont, color: rgb(1, 1, 1) },
            ],
            base4: [
                { x: 80, y: 970, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 660, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: 570, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: 460, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: textColor },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor },
            ],
            base5: [
                { x: 170, y: 970, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 170, y: 660, fontSize: 70, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 170, y: 570, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) },
                { x: 170, y: 510, fontSize: 180, font: boldFont, color: rgb(1, 1, 1) },
                { x: 170, y: 410, fontSize: 90, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 170, y: 350, fontSize: 48, font: regularFont, color: rgb(1, 1, 1) },
            ],
            base6: [
                { x: 80, y: 970, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 660, fontSize: 70, font: mediumFont, color: textColor },
                { x: 80, y: 570, fontSize: 120, font: boldFont, color: textColor },
                { x: 80, y: 460, fontSize: 230, font: boldFont, color: textColor },
                { x: 80, y: 340, fontSize: 90, font: mediumFont, color: textColor },
                { x: 80, y: 280, fontSize: 48, font: regularFont, color: textColor },
            ],
            base7: [
                { x: 80, y: 970, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 660, fontSize: 70, font: mediumFont, color: rgb(1, 1, 1) },
                { x: 80, y: 570, fontSize: 120, font: boldFont, color: rgb(1, 1, 1) },
                { x: 80, y: 460, fontSize: 230, font: boldFont, color: rgb(1, 1, 1) },
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
                // Skip Field 1 (Discount Percentage) and Field 3 (Original Price) for certain templates
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

                    // Add "МКД / MKD" label to price fields (3 and 4)
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
}


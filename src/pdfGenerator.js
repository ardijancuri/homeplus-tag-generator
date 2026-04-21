import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'

import futuraBookUrl from '../server/fonts/FuturaCyrillicBook.ttf?url'
import futuraBoldUrl from '../server/fonts/FuturaCyrillicBold.ttf?url'
import futuraDemiUrl from '../server/fonts/FuturaCyrillicDemi.ttf?url'

import template6BadgeUrl from '../Group 231.png?url'
import template6FooterLogoUrl from '../template6-logo.png?url'
import base1SvgUrl from './images/base1.svg?url'
import base2SvgUrl from './images/base2.svg?url'
import base3SvgUrl from './images/base3.svg?url'
import base4SvgUrl from './images/base4.svg?url'
import { getEditableTemplateLayout } from './templateLayouts'

const TEXT_COLOR = rgb(55 / 255, 52 / 255, 53 / 255)
const TEMPLATE_6_ID = 'base2'
const TEMPLATE_6_BADGE_ASPECT_RATIO = 180 / 440
const TEMPLATE_6_YELLOW = rgb(254 / 255, 190 / 255, 16 / 255)
const TEMPLATE_6_RED = rgb(239 / 255, 59 / 255, 54 / 255)
const TEMPLATE_6_BLACK = rgb(35 / 255, 31 / 255, 32 / 255)
const TEMPLATE_5_RED = rgb(237 / 255, 52 / 255, 56 / 255)
const TEMPLATE_7_GREEN = rgb(99 / 255, 157 / 255, 123 / 255)
const TEMPLATE_8_BLUE = rgb(72 / 255, 113 / 255, 170 / 255)
const PDF_PAGE_WIDTH = 841.8898
const PDF_PAGE_HEIGHT = 1190.5512
const TEMPLATE_BACKGROUND_SVG_URLS = {
    base3: base1SvgUrl,
    base2: base2SvgUrl,
    base5: base3SvgUrl,
    base7: base4SvgUrl,
}

const assetBytesCache = new Map()
const rasterizedSvgCache = new Map()

async function loadAssetBytes(url) {
    if (!assetBytesCache.has(url)) {
        assetBytesCache.set(url, (async () => {
            const response = await fetch(url)

            if (!response.ok) {
                throw new Error(`Failed to load asset: ${url}`)
            }

            return response.arrayBuffer()
        })())
    }

    return assetBytesCache.get(url)
}

async function loadAssetText(url) {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Failed to load asset: ${url}`)
    }

    return response.text()
}

async function rasterizeSvgToPngBytes(svgUrl, width, height) {
    const cacheKey = `${svgUrl}|${width}x${height}`

    if (!rasterizedSvgCache.has(cacheKey)) {
        rasterizedSvgCache.set(cacheKey, (async () => {
            const svgText = await loadAssetText(svgUrl)
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
            const objectUrl = URL.createObjectURL(svgBlob)

            try {
                const image = await new Promise((resolve, reject) => {
                    const nextImage = new Image()
                    nextImage.onload = () => resolve(nextImage)
                    nextImage.onerror = () => reject(new Error(`Failed to rasterize SVG: ${svgUrl}`))
                    nextImage.src = objectUrl
                })

                const canvas = document.createElement('canvas')
                canvas.width = Math.round(width)
                canvas.height = Math.round(height)
                const context = canvas.getContext('2d')

                if (!context) {
                    throw new Error('Failed to create canvas context for SVG rasterization')
                }

                context.drawImage(image, 0, 0, canvas.width, canvas.height)

                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
                if (!blob) {
                    throw new Error(`Failed to export rasterized SVG: ${svgUrl}`)
                }

                return blob.arrayBuffer()
            } finally {
                URL.revokeObjectURL(objectUrl)
            }
        })())
    }

    return rasterizedSvgCache.get(cacheKey)
}

async function embedFonts(pdfDoc) {
    pdfDoc.registerFontkit(fontkit)

    const [regularBytes, boldBytes, mediumBytes] = await Promise.all([
        loadAssetBytes(futuraBookUrl),
        loadAssetBytes(futuraBoldUrl),
        loadAssetBytes(futuraDemiUrl),
    ])

    return {
        regularFont: await pdfDoc.embedFont(regularBytes),
        boldFont: await pdfDoc.embedFont(boldBytes),
        mediumFont: await pdfDoc.embedFont(mediumBytes),
    }
}

function drawRoundedPill(page, { x, y, width, height, color }) {
    const radius = height / 2

    page.drawRectangle({
        x: x + radius,
        y,
        width: width - radius * 2,
        height,
        color,
    })

    page.drawCircle({
        x: x + radius,
        y: y + radius,
        size: radius,
        color,
    })

    page.drawCircle({
        x: x + width - radius,
        y: y + radius,
        size: radius,
        color,
    })
}

function drawTemplate6DiscountBadge(page, { x, y, width, height, color }) {
    const leftRadius = height / 2
    const bottomRightRadius = height / 2

    page.drawRectangle({
        x: x + leftRadius,
        y,
        width: width - leftRadius - bottomRightRadius,
        height,
        color,
    })

    page.drawRectangle({
        x: x + width - bottomRightRadius,
        y: y + bottomRightRadius,
        width: bottomRightRadius,
        height: height - bottomRightRadius,
        color,
    })

    page.drawCircle({
        x: x + leftRadius,
        y: y + leftRadius,
        size: leftRadius,
        color,
    })

    page.drawCircle({
        x: x + width - bottomRightRadius,
        y: y + bottomRightRadius,
        size: bottomRightRadius,
        color,
    })
}

function getContainedImageRect(image, boxX, boxY, boxWidth, boxHeight) {
    const scale = Math.min(boxWidth / image.width, boxHeight / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale

    return {
        x: boxX + (boxWidth - drawWidth) / 2,
        y: boxY + (boxHeight - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
    }
}

function wrapText(text, font, fontSize, maxWidth) {
    const words = `${text || ''}`.split(/\s+/).filter(Boolean)
    const lines = []
    let currentLine = ''

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word

        if (!currentLine || font.widthOfTextAtSize(nextLine, fontSize) <= maxWidth) {
            currentLine = nextLine
            continue
        }

        lines.push(currentLine)
        currentLine = word
    }

    if (currentLine) {
        lines.push(currentLine)
    }

    return lines
}

function drawWrappedText(page, text, { x, y, font, size, color, maxWidth, lineHeight }) {
    const lines = wrapText(text, font, size, maxWidth)

    lines.forEach((line, index) => {
        page.drawText(line, {
            x,
            y: y - index * lineHeight,
            size,
            font,
            color,
        })
    })

    return lines.length
}

function getCenteredTextBottomY(font, fontSize, boxBottomY, boxHeight) {
    const textHeight = font.heightAtSize(fontSize, { descender: false })
    return boxBottomY + (boxHeight - textHeight) / 2 + boxHeight * 0.12
}

function ensureDiscountText(value) {
    const rawValue = `${value || ''}`.trim()

    if (!rawValue) {
        return '-30%'
    }

    return rawValue.startsWith('-') ? rawValue : `-${rawValue}`
}

function ensurePriceText(value) {
    const rawValue = `${value || ''}`.trim()

    if (!rawValue) {
        return ''
    }

    const withoutSuffix = rawValue.replace(/\s*,\s*-\s*$/u, '').trim()
    return `${withoutSuffix},-`
}

function drawPriceText(page, { priceText, x, y, priceFont, priceSize, color, mainToCommaOverlapRatio = 0.08, commaToDashOverlapRatio = 0.18 }) {
    const suffixMatch = /^(.*?)(,-)$/u.exec(priceText)

    if (!suffixMatch) {
        page.drawText(priceText, {
            x,
            y,
            size: priceSize,
            font: priceFont,
            color,
        })

        return {
            textWidth: priceFont.widthOfTextAtSize(priceText, priceSize),
            dashCenterX: x + priceFont.widthOfTextAtSize(priceText, priceSize),
        }
    }

    const [, mainPart, suffix] = suffixMatch
    const commaText = suffix[0]
    const dashText = suffix[1]
    const mainWidth = priceFont.widthOfTextAtSize(mainPart, priceSize)
    const commaWidth = priceFont.widthOfTextAtSize(commaText, priceSize)
    const dashWidth = priceFont.widthOfTextAtSize(dashText, priceSize)
    const mainToCommaOverlap = Math.max(priceSize * mainToCommaOverlapRatio, 1.5)
    const commaToDashOverlap = Math.max(priceSize * commaToDashOverlapRatio, 3)
    const commaX = x + mainWidth - mainToCommaOverlap
    const dashX = commaX + commaWidth - commaToDashOverlap

    if (mainPart) {
        page.drawText(mainPart, {
            x,
            y,
            size: priceSize,
            font: priceFont,
            color,
        })
    }

    page.drawText(commaText, {
        x: commaX,
        y,
        size: priceSize,
        font: priceFont,
        color,
    })

    page.drawText(dashText, {
        x: dashX,
        y,
        size: priceSize,
        font: priceFont,
        color,
    })

    return {
        textWidth: mainWidth + commaWidth + dashWidth - mainToCommaOverlap - commaToDashOverlap,
        dashCenterX: dashX + dashWidth / 2,
    }
}

function drawDenAbovePriceSuffix(page, { priceText, x, y, priceFont, priceSize, color, labelFont, dashCenterX }) {
    const denText = '\u0414\u0415\u041d'
    const denSize = Math.max(priceSize * 0.22, 14)
    const denWidth = labelFont.widthOfTextAtSize(denText, denSize)
    const fallbackTextWidth = priceFont.widthOfTextAtSize(priceText, priceSize)
    const fallbackDashWidth = priceFont.widthOfTextAtSize('-', priceSize)
    const resolvedDashCenterX = dashCenterX ?? (x + fallbackTextWidth - fallbackDashWidth / 2)

    page.drawText(denText, {
        x: resolvedDashCenterX - denWidth / 2,
        y: y + priceSize * 0.42,
        size: denSize,
        font: labelFont,
        color,
    })
}

function getTemplateTextColor(selectedTemplate, isDiscountText = false) {
    if (isDiscountText) {
        return rgb(1, 1, 1)
    }

    if (selectedTemplate === 'base3') {
        return TEMPLATE_5_RED
    }

    if (selectedTemplate === 'base5') {
        return TEMPLATE_7_GREEN
    }

    if (selectedTemplate === 'base7') {
        return TEMPLATE_8_BLUE
    }

    return TEMPLATE_6_BLACK
}

function isTemplate6(selectedTemplate) {
    return selectedTemplate === TEMPLATE_6_ID
}

function isTemplate6StyleTemplate(selectedTemplate) {
    return selectedTemplate === 'base2' || selectedTemplate === 'base5' || selectedTemplate === 'base7'
}

function isTemplate6StyleDiscount(selectedTemplate, fieldKey) {
    return isTemplate6StyleTemplate(selectedTemplate) && fieldKey === 'field1'
}

async function prepareTemplate6Assets(pdfDoc) {
    const [badgeBytes, footerLogoBytes] = await Promise.all([
        loadAssetBytes(template6BadgeUrl),
        loadAssetBytes(template6FooterLogoUrl),
    ])

    return {
        badgeImage: await pdfDoc.embedPng(badgeBytes),
        footerLogoImage: await pdfDoc.embedPng(footerLogoBytes),
    }
}

async function prepareLayoutAssets(pdfDoc, layoutItems) {
    const assetKeys = [...new Set(layoutItems.filter(item => item.type === 'image').map(item => item.assetKey))]
    const assets = {}

    await Promise.all(assetKeys.map(async assetKey => {
        if (assetKey === 'template6Badge') {
            assets[assetKey] = await pdfDoc.embedPng(await loadAssetBytes(template6BadgeUrl))
        }

        if (assetKey === 'template6FooterLogo') {
            assets[assetKey] = await pdfDoc.embedPng(await loadAssetBytes(template6FooterLogoUrl))
        }
    }))

    return assets
}

async function prepareTemplateBackground(pdfDoc, selectedTemplate, width, height) {
    const svgUrl = TEMPLATE_BACKGROUND_SVG_URLS[selectedTemplate]
    if (!svgUrl) {
        return null
    }

    const pngBytes = await rasterizeSvgToPngBytes(svgUrl, width, height)
    return pdfDoc.embedPng(pngBytes)
}

function drawStoredLayoutPage({ page, layoutItems, formData, selectedTemplate, fonts, assets, backgroundImage }) {
    const { width, height } = page.getSize()

    if (backgroundImage) {
        page.drawImage(backgroundImage, {
            x: 0,
            y: 0,
            width,
            height,
        })
    }

    const fontMap = {
        bold: fonts.boldFont,
        medium: fonts.mediumFont,
        regular: fonts.regularFont,
    }

    layoutItems.forEach(item => {
        const absoluteX = item.x * width
        const absoluteY = item.y * height
        const absoluteWidth = item.w * width
        const absoluteHeight = item.h * height

        if (item.type === 'image') {
            const image = assets[item.assetKey]
            if (!image) {
                return
            }

            const imageRect = getContainedImageRect(
                image,
                absoluteX,
                height - absoluteY - absoluteHeight,
                absoluteWidth,
                absoluteHeight
            )

            page.drawImage(image, imageRect)
            return
        }

        const fieldValue = `${formData[item.fieldKey] || ''}`.trim()
        if (!fieldValue) {
            return
        }

        const font = fontMap[item.fontKey] || fonts.mediumFont
        const isTemplate6Discount = isTemplate6StyleDiscount(selectedTemplate, item.fieldKey)
        const isPriceField = item.fieldKey === 'field3' || item.fieldKey === 'field4'
        const displayValue = isPriceField ? ensurePriceText(fieldValue) : fieldValue
        const fontSize = isTemplate6Discount ? absoluteHeight * 1.06 : absoluteHeight
        const boxBottomY = height - absoluteY - absoluteHeight
        const baselineY = isTemplate6Discount
            ? getCenteredTextBottomY(font, fontSize, boxBottomY, absoluteHeight) + absoluteHeight * 0.08
            : boxBottomY + (absoluteHeight - fontSize) / 2
        const textX = isTemplate6Discount ? absoluteX + absoluteWidth * 0.03 : absoluteX
        const textColor = getTemplateTextColor(selectedTemplate, isTemplate6Discount)
        let priceMetrics = null

        if (item.wrap) {
            drawWrappedText(page, displayValue, {
                x: textX,
                y: baselineY,
                font,
                size: fontSize,
                color: textColor,
                maxWidth: absoluteWidth,
                lineHeight: (item.lineHeight || item.h * 1.1) * height,
            })
        } else if (isPriceField) {
            priceMetrics = drawPriceText(page, {
                priceText: displayValue,
                x: textX,
                y: baselineY,
                priceFont: font,
                priceSize: fontSize,
                color: textColor,
                mainToCommaOverlapRatio: item.fieldKey === 'field3' ? 0.05 : 0.08,
            })
        } else {
            page.drawText(displayValue, {
                x: textX,
                y: baselineY,
                size: fontSize,
                font,
                color: textColor,
            })
        }

        if (item.fieldKey === 'field3') {
            const textWidth = priceMetrics?.textWidth ?? font.widthOfTextAtSize(displayValue, fontSize)

            if (isTemplate6StyleTemplate(selectedTemplate)) {
                const textHeight = font.heightAtSize(fontSize, { descender: false })
                const lineCenterX = absoluteX + Math.min(textWidth * 0.38, absoluteWidth * 0.34)
                const lineCenterY = baselineY + textHeight * 0.30
                const lineHalfWidth = Math.min(textWidth * 0.18, absoluteWidth * 0.16)
                const lineHalfHeight = lineHalfWidth * Math.tan((55 * Math.PI) / 180)
                const lineStartX = lineCenterX - lineHalfWidth
                const lineStartY = lineCenterY - lineHalfHeight
                const lineEndX = lineCenterX + lineHalfWidth
                const lineEndY = lineCenterY + lineHalfHeight

                drawDenAbovePriceSuffix(page, {
                    priceText: displayValue,
                    x: absoluteX,
                    y: baselineY,
                    priceFont: font,
                    priceSize: fontSize,
                    color: selectedTemplate === TEMPLATE_6_ID ? TEMPLATE_6_BLACK : textColor,
                    labelFont: fonts.boldFont,
                    dashCenterX: priceMetrics?.dashCenterX,
                })

                page.drawLine({
                    start: { x: lineStartX, y: lineStartY },
                    end: { x: lineEndX, y: lineEndY },
                    thickness: Math.max(fontSize * 0.06, 3.5),
                    color: TEMPLATE_6_RED,
                })
            } else {
                drawDenAbovePriceSuffix(page, {
                    priceText: displayValue,
                    x: absoluteX,
                    y: baselineY,
                    priceFont: font,
                    priceSize: fontSize,
                    color: textColor,
                    labelFont: fonts.boldFont,
                    dashCenterX: priceMetrics?.dashCenterX,
                })

                if (selectedTemplate === 'base') {
                    page.drawLine({
                        start: { x: absoluteX, y: baselineY + fontSize * 0.35 },
                        end: { x: absoluteX + textWidth, y: baselineY + fontSize * 0.35 },
                        thickness: 6,
                        color: rgb(230 / 255, 53 / 255, 39 / 255),
                    })
                }
            }
        }

        if (item.fieldKey === 'field4') {
            if (selectedTemplate === TEMPLATE_6_ID) {
                drawDenAbovePriceSuffix(page, {
                    priceText: displayValue,
                    x: absoluteX,
                    y: baselineY,
                    priceFont: font,
                    priceSize: fontSize,
                    color: TEMPLATE_6_BLACK,
                    labelFont: fonts.boldFont,
                    dashCenterX: priceMetrics?.dashCenterX,
                })
            } else {
                drawDenAbovePriceSuffix(page, {
                    priceText: displayValue,
                    x: absoluteX,
                    y: baselineY,
                    priceFont: font,
                    priceSize: fontSize,
                    color: textColor,
                    labelFont: fonts.boldFont,
                    dashCenterX: priceMetrics?.dashCenterX,
                })
            }
        }
    })
}

function drawTemplate6Page({ page, formData, regularFont, boldFont, mediumFont, assets }) {
    const { width, height } = page.getSize()

    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: TEMPLATE_6_YELLOW,
    })

    const badgeWidth = 470
    const badgeHeight = badgeWidth * TEMPLATE_6_BADGE_ASPECT_RATIO
    page.drawImage(assets.badgeImage, {
        x: 48,
        y: height - 225,
        width: badgeWidth,
        height: badgeHeight,
    })

    drawTemplate6DiscountBadge(page, {
        x: 56,
        y: height - 445,
        width: 306,
        height: 102,
        color: TEMPLATE_6_RED,
    })

    page.drawText(ensureDiscountText(formData.field1), {
        x: 72,
        y: height - 420,
        size: 76,
        font: boldFont,
        color: rgb(1, 1, 1),
    })

    const originalPrice = ensurePriceText(formData.field3)
    if (originalPrice) {
        const originalPriceX = 70
        const originalPriceY = height - 540
        const originalPriceSize = 56
        const originalPriceWidth = mediumFont.widthOfTextAtSize(originalPrice, originalPriceSize)

        page.drawText(originalPrice, {
            x: originalPriceX,
            y: originalPriceY,
            size: originalPriceSize,
            font: mediumFont,
            color: TEMPLATE_6_BLACK,
        })

        drawDenAbovePriceSuffix(page, {
            priceText: originalPrice,
            x: originalPriceX,
            y: originalPriceY,
            priceFont: mediumFont,
            priceSize: originalPriceSize,
            color: TEMPLATE_6_BLACK,
            labelFont: boldFont,
        })

        page.drawLine({
            start: { x: originalPriceX - 2, y: originalPriceY + 22 },
            end: { x: originalPriceX + originalPriceWidth + 38, y: originalPriceY + 43 },
            thickness: 5,
            color: TEMPLATE_6_RED,
        })
    }

    const discountedPrice = ensurePriceText(formData.field4)
    if (discountedPrice) {
        const discountedPriceX = 50
        const discountedPriceY = height - 725
        const discountedPriceSize = 178

        page.drawText(discountedPrice, {
            x: discountedPriceX,
            y: discountedPriceY,
            size: discountedPriceSize,
            font: boldFont,
            color: TEMPLATE_6_BLACK,
        })

        drawDenAbovePriceSuffix(page, {
            priceText: discountedPrice,
            x: discountedPriceX,
            y: discountedPriceY,
            priceFont: boldFont,
            priceSize: discountedPriceSize,
            color: TEMPLATE_6_BLACK,
            labelFont: boldFont,
        })
    }

    let currentY = 330
    const productName = `${formData.field2 || ''}`.trim()
    if (productName) {
        const lineCount = drawWrappedText(page, productName, {
            x: 70,
            y: currentY,
            font: mediumFont,
            size: 20,
            color: TEMPLATE_6_BLACK,
            maxWidth: width - 140,
            lineHeight: 24,
        })
        currentY -= lineCount * 24 + 8
    }

    const productCode = `${formData.field5 || ''}`.trim()
    if (productCode) {
        page.drawText(productCode, {
            x: 70,
            y: currentY,
            size: 18,
            font: mediumFont,
            color: TEMPLATE_6_BLACK,
        })
        currentY -= 22
    }

    page.drawImage(assets.footerLogoImage, {
        x: 72,
        y: 105,
        width: 150,
        height: 150 * (43 / 139),
    })
}

function getTemplateConfigs(height, { regularFont, boldFont, mediumFont }) {
    return {
        base: [
            { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
            { x: 80, y: height - 520, fontSize: 70, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: height - 650, fontSize: 120, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: height - 840, fontSize: 230, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: 260, fontSize: 50, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: 200, fontSize: 40, font: regularFont, color: TEXT_COLOR },
        ],
        base1: [
            { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
            { x: 80, y: height - 560, fontSize: 70, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: height - 650, fontSize: 120, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: height - 760, fontSize: 230, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: 340, fontSize: 64, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: 280, fontSize: 48, font: regularFont, color: TEXT_COLOR },
        ],
        base2: [
            { x: 80, y: height - 250, fontSize: 260, font: boldFont, color: rgb(1, 1, 1) },
            { x: 80, y: height - 620, fontSize: 70, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: height - 660, fontSize: 120, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: height - 810, fontSize: 230, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: 300, fontSize: 64, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: 240, fontSize: 48, font: regularFont, color: TEXT_COLOR },
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
            { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: 340, fontSize: 90, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: 280, fontSize: 48, font: regularFont, color: TEXT_COLOR },
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
            { x: 80, y: height - 530, fontSize: 70, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: height - 620, fontSize: 120, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: height - 730, fontSize: 230, font: boldFont, color: TEXT_COLOR },
            { x: 80, y: 340, fontSize: 90, font: mediumFont, color: TEXT_COLOR },
            { x: 80, y: 280, fontSize: 48, font: regularFont, color: TEXT_COLOR },
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
}

function drawStandardTemplatePage(page, formData, selectedTemplate, fonts) {
    const { width, height } = page.getSize()
    const templateConfigs = getTemplateConfigs(height, fonts)
    const fieldPositions = templateConfigs[selectedTemplate] || templateConfigs.base

    for (let i = 1; i <= 6; i++) {
        if (
            (i === 1 || i === 3) &&
            (selectedTemplate === 'base1' ||
                selectedTemplate === 'base4' ||
                selectedTemplate === 'base5' ||
                selectedTemplate === 'base6' ||
                selectedTemplate === 'base7')
        ) {
            continue
        }

        const fieldValue = formData[`field${i}`] || ''
        const position = fieldPositions[i - 1]

        if (!fieldValue) {
            continue
        }

        const displayValue =
            i === 3 || i === 4
                ? ensurePriceText(fieldValue)
                : fieldValue

        page.drawText(displayValue, {
            x: position.x,
            y: position.y,
            size: position.fontSize,
            font: position.font,
            color: position.color,
        })

        if (i === 3 && (selectedTemplate === 'base' || selectedTemplate === 'base3')) {
            const estimatedTextWidth = position.fontSize * displayValue.length * 0.5
            const lineY = position.y + position.fontSize * 0.35

            page.drawLine({
                start: { x: position.x, y: lineY },
                end: { x: position.x + estimatedTextWidth, y: lineY },
                thickness: 6,
                color: rgb(230 / 255, 53 / 255, 39 / 255),
            })
        }

        if (i === 3 || i === 4) {
            drawDenAbovePriceSuffix(page, {
                priceText: displayValue,
                x: position.x,
                y: position.y,
                priceFont: position.font,
                priceSize: position.fontSize,
                color: position.color,
                labelFont: fonts.boldFont,
            })
        }
    }
}

export async function generatePdfBlob(formData) {
    const selectedTemplate = formData.template || 'base'
    const pdfDoc = await PDFDocument.create()
    const fonts = await embedFonts(pdfDoc)
    const page = pdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT])
    const editableLayout = getEditableTemplateLayout(selectedTemplate)
    const backgroundImage = await prepareTemplateBackground(pdfDoc, selectedTemplate, page.getWidth(), page.getHeight())

    if (editableLayout?.length) {
        const assets = await prepareLayoutAssets(pdfDoc, editableLayout)
        drawStoredLayoutPage({
            page,
            layoutItems: editableLayout,
            formData,
            selectedTemplate,
            fonts,
            assets,
            backgroundImage,
        })

        const pdfBytes = await pdfDoc.save()
        return new Blob([pdfBytes], { type: 'application/pdf' })
    }

    if (isTemplate6(selectedTemplate)) {
        const assets = await prepareTemplate6Assets(pdfDoc)
        drawTemplate6Page({
            page,
            formData,
            ...fonts,
            assets,
        })
    } else {
        drawStandardTemplatePage(page, formData, selectedTemplate, fonts)
    }

    const pdfBytes = await pdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
}

export async function generateBatchPdfBlob(products, selectedTemplate) {
    const finalPdfDoc = await PDFDocument.create()
    const fonts = await embedFonts(finalPdfDoc)
    const editableLayout = getEditableTemplateLayout(selectedTemplate)
    const editableLayoutAssets = editableLayout?.length ? await prepareLayoutAssets(finalPdfDoc, editableLayout) : null
    const backgroundImage = await prepareTemplateBackground(finalPdfDoc, selectedTemplate, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT)
    const template6Assets = isTemplate6(selectedTemplate)
        ? await prepareTemplate6Assets(finalPdfDoc)
        : null

    for (const product of products) {
        const templatePage = finalPdfDoc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT])

        if (editableLayout?.length) {
            drawStoredLayoutPage({
                page: templatePage,
                layoutItems: editableLayout,
                formData: product,
                selectedTemplate,
                fonts,
                assets: editableLayoutAssets,
                backgroundImage,
            })
            continue
        }

        if (template6Assets) {
            drawTemplate6Page({
                page: templatePage,
                formData: product,
                ...fonts,
                assets: template6Assets,
            })
        } else {
            drawStandardTemplatePage(templatePage, product, selectedTemplate, fonts)
        }
    }

    const pdfBytes = await finalPdfDoc.save()
    return new Blob([pdfBytes], { type: 'application/pdf' })
}

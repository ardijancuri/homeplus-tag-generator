import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { rgb } from 'pdf-lib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const TEMPLATE_6_ID = 'base2'
const TEMPLATE_6_BADGE_ASPECT_RATIO = 180 / 440
const TEMPLATE_6_YELLOW = rgb(254 / 255, 190 / 255, 16 / 255)
const TEMPLATE_6_RED = rgb(239 / 255, 59 / 255, 54 / 255)
const TEMPLATE_6_BLACK = rgb(35 / 255, 31 / 255, 32 / 255)
let template6BadgeBytesPromise
let template6FooterLogoBytesPromise

function loadTemplate6BadgeBytes() {
    if (!template6BadgeBytesPromise) {
        template6BadgeBytesPromise = readFile(join(__dirname, '..', 'Group 231.png'))
    }

    return template6BadgeBytesPromise
}

function loadTemplate6FooterLogoBytes() {
    if (!template6FooterLogoBytesPromise) {
        template6FooterLogoBytesPromise = readFile(join(__dirname, '..', 'template6-logo.png'))
    }

    return template6FooterLogoBytesPromise
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

function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(/\s+/).filter(Boolean)
    const lines = []
    let currentLine = ''

    for (const word of words) {
        const nextLine = currentLine ? `${currentLine} ${word}` : word

        if (font.widthOfTextAtSize(nextLine, fontSize) <= maxWidth || !currentLine) {
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

function ensureDiscountText(value) {
    const rawValue = `${value || ''}`.trim()

    if (!rawValue) {
        return '-30%'
    }

    return rawValue.startsWith('-') ? rawValue : `-${rawValue}`
}

export function isTemplate6(selectedTemplate) {
    return selectedTemplate === TEMPLATE_6_ID
}

export async function prepareTemplate6Assets(pdfDoc) {
    const badgeBytes = await loadTemplate6BadgeBytes()
    const footerLogoBytes = await loadTemplate6FooterLogoBytes()

    return {
        badgeImage: await pdfDoc.embedPng(badgeBytes),
        footerLogoImage: await pdfDoc.embedPng(footerLogoBytes),
    }
}

export function drawTemplate6Page({
    page,
    formData,
    regularFont,
    boldFont,
    mediumFont,
    assets,
}) {
    const { width, height } = page.getSize()

    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: TEMPLATE_6_YELLOW,
    })

    const badgeWidth = 430
    const badgeHeight = badgeWidth * TEMPLATE_6_BADGE_ASPECT_RATIO
    page.drawImage(assets.badgeImage, {
        x: 56,
        y: height - 245,
        width: badgeWidth,
        height: badgeHeight,
    })

    drawRoundedPill(page, {
        x: 56,
        y: height - 445,
        width: 306,
        height: 102,
        color: TEMPLATE_6_RED,
    })

    page.drawText(ensureDiscountText(formData.field1), {
        x: 80,
        y: height - 418,
        size: 68,
        font: boldFont,
        color: rgb(1, 1, 1),
    })

    const originalPrice = `${formData.field3 || ''}`.trim()
    if (originalPrice) {
        const originalPriceX = 70
        const originalPriceY = height - 540
        const originalPriceSize = 48
        const originalPriceWidth = mediumFont.widthOfTextAtSize(originalPrice, originalPriceSize)

        page.drawText(originalPrice, {
            x: originalPriceX,
            y: originalPriceY,
            size: originalPriceSize,
            font: mediumFont,
            color: TEMPLATE_6_BLACK,
        })

        page.drawText('ден', {
            x: originalPriceX + originalPriceWidth + 8,
            y: originalPriceY + 10,
            size: 16,
            font: boldFont,
            color: TEMPLATE_6_BLACK,
        })

        page.drawLine({
            start: { x: originalPriceX - 2, y: originalPriceY + 19 },
            end: { x: originalPriceX + originalPriceWidth + 34, y: originalPriceY + 37 },
            thickness: 4,
            color: TEMPLATE_6_RED,
        })
    }

    const discountedPrice = `${formData.field4 || ''}`.trim()
    if (discountedPrice) {
        const discountedPriceX = 50
        const discountedPriceY = height - 700
        const discountedPriceSize = 138
        const discountedPriceWidth = boldFont.widthOfTextAtSize(discountedPrice, discountedPriceSize)

        page.drawText(discountedPrice, {
            x: discountedPriceX,
            y: discountedPriceY,
            size: discountedPriceSize,
            font: boldFont,
            color: TEMPLATE_6_BLACK,
        })

        page.drawText('ДЕН', {
            x: discountedPriceX + discountedPriceWidth + 10,
            y: discountedPriceY + 62,
            size: 36,
            font: boldFont,
            color: TEMPLATE_6_BLACK,
        })
    }

    let currentY = 210
    const productName = `${formData.field2 || ''}`.trim()
    if (productName) {
        const lineCount = drawWrappedText(page, productName, {
            x: 70,
            y: currentY,
            font: mediumFont,
            size: 22,
            color: TEMPLATE_6_BLACK,
            maxWidth: width - 140,
            lineHeight: 26,
        })
        currentY -= lineCount * 26 + 8
    }

    const productCode = `${formData.field5 || ''}`.trim()
    if (productCode) {
        page.drawText(productCode, {
            x: 70,
            y: currentY,
            size: 20,
            font: mediumFont,
            color: TEMPLATE_6_BLACK,
        })
        currentY -= 26
    }

    const dimensions = `${formData.field6 || ''}`.trim()
    if (dimensions) {
        drawWrappedText(page, dimensions, {
            x: 70,
            y: currentY,
            font: regularFont,
            size: 15,
            color: TEMPLATE_6_BLACK,
            maxWidth: width - 140,
            lineHeight: 18,
        })
    }

    page.drawImage(assets.footerLogoImage, {
        x: 72,
        y: 40,
        width: 150,
        height: 150 * (43 / 139),
    })
}

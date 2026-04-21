export const sampleFieldValues = {
    field1: '-30%',
    field2: 'Product name text',
    field3: '900,-',
    field4: '600,-',
    field5: '323 559 110',
}

const template6StyleLayout = [
    { id: 'field1', type: 'text', fieldKey: 'field1', x: 0.098, y: 0.307, w: 0.29, h: 0.122, fontKey: 'bold', label: 'Discount' },
    { id: 'field3', type: 'text', fieldKey: 'field3', x: 0.095, y: 0.457, w: 0.285, h: 0.059, fontKey: 'regular', label: 'Old Price' },
    { id: 'field4', type: 'text', fieldKey: 'field4', x: 0.092, y: 0.485, w: 0.6, h: 0.2, fontKey: 'bold', label: 'Discounted Price' },
    { id: 'field2', type: 'text', fieldKey: 'field2', x: 0.095, y: 0.735, w: 0.73, h: 0.032, lineHeight: 0.036, wrap: true, fontKey: 'regular', label: 'Product Name' },
    { id: 'field5', type: 'text', fieldKey: 'field5', x: 0.095, y: 0.781, w: 0.38, h: 0.032, fontKey: 'regular', label: 'Product Code' },
]

const template7StyleLayout = [
    { id: 'field1', type: 'text', fieldKey: 'field1', x: 0.11, y: 0.307, w: 0.29, h: 0.122, fontKey: 'bold', label: 'Discount' },
    { id: 'field3', type: 'text', fieldKey: 'field3', x: 0.107, y: 0.457, w: 0.285, h: 0.059, fontKey: 'regular', label: 'Old Price' },
    { id: 'field4', type: 'text', fieldKey: 'field4', x: 0.104, y: 0.485, w: 0.6, h: 0.2, fontKey: 'bold', label: 'Discounted Price' },
    { id: 'field2', type: 'text', fieldKey: 'field2', x: 0.107, y: 0.735, w: 0.73, h: 0.032, lineHeight: 0.036, wrap: true, fontKey: 'regular', label: 'Product Name' },
    { id: 'field5', type: 'text', fieldKey: 'field5', x: 0.107, y: 0.781, w: 0.38, h: 0.032, fontKey: 'regular', label: 'Product Code' },
]

const template8StyleLayout = [
    { id: 'field1', type: 'text', fieldKey: 'field1', x: 0.086, y: 0.307, w: 0.29, h: 0.122, fontKey: 'bold', label: 'Discount' },
    { id: 'field3', type: 'text', fieldKey: 'field3', x: 0.083, y: 0.457, w: 0.285, h: 0.059, fontKey: 'regular', label: 'Old Price' },
    { id: 'field4', type: 'text', fieldKey: 'field4', x: 0.08, y: 0.485, w: 0.6, h: 0.2, fontKey: 'bold', label: 'Discounted Price' },
    { id: 'field2', type: 'text', fieldKey: 'field2', x: 0.083, y: 0.735, w: 0.73, h: 0.032, lineHeight: 0.036, wrap: true, fontKey: 'regular', label: 'Product Name' },
    { id: 'field5', type: 'text', fieldKey: 'field5', x: 0.083, y: 0.781, w: 0.38, h: 0.032, fontKey: 'regular', label: 'Product Code' },
]

const defaultLayouts = {
    base2: template6StyleLayout,
    base3: [
        { id: 'field3', type: 'text', fieldKey: 'field3', x: 0.092, y: 0.485, w: 0.6, h: 0.2, fontKey: 'bold', label: 'Original Price' },
        { id: 'field2', type: 'text', fieldKey: 'field2', x: 0.12, y: 0.735, w: 0.73, h: 0.032, wrap: true, lineHeight: 0.036, fontKey: 'regular', label: 'Product Name' },
        { id: 'field5', type: 'text', fieldKey: 'field5', x: 0.12, y: 0.781, w: 0.38, h: 0.032, fontKey: 'regular', label: 'Product Code' },
    ],
    base5: template7StyleLayout,
    base7: template8StyleLayout,
}

function cloneItems(items) {
    return items.map(item => ({ ...item }))
}

export function getDefaultTemplateLayout(templateId) {
    return cloneItems(defaultLayouts[templateId] || [])
}

export function getEditableTemplateLayout(templateId) {
    return getDefaultTemplateLayout(templateId)
}

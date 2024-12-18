export function sanitizeInlineStyle(styleString: string): string {
  const allowedProperties = [
    'color',
    'background-color',
    'font-size',
    'font-family',
    'font-weight',
    'font-style',
    'text-decoration',
    'text-align',
    'line-height',
    'letter-spacing',
    'margin',
    'padding',
    'border',
    'border-radius',
    'display',
    'width',
    'height',
  ]

  // Split the style string into individual declarations
  // Style is typically "property: value; property2: value2;"
  const declarations = styleString
    .split(';')
    .map((dec) => dec.trim())
    .filter(Boolean)

  const sanitizedDeclarations: string[] = []

  for (const decl of declarations) {
    const [property, ...valueParts] = decl.split(':')
    if (!property || valueParts.length === 0) {
      continue
    }

    const propName = property.trim().toLowerCase()
    const propValue = valueParts.join(':').trim()

    // Check if property is allowed
    if (!allowedProperties.includes(propName)) {
      continue
    }

    // Check for suspicious patterns that might allow CSS injection
    const forbiddenPatterns = [/url\s*\(/i, /expression\s*\(/i, /javascript\s*:/i, /data\s*:/i, /@import/i]

    if (forbiddenPatterns.some((pattern) => pattern.test(propValue))) {
      continue
    }

    // If it passed all checks, include it
    sanitizedDeclarations.push(`${propName}: ${propValue}`)
  }

  return sanitizedDeclarations.join('; ')
}

export function sanitizeLexicalState(lexicalJSON: string): string {
  let state: any
  try {
    state = JSON.parse(lexicalJSON)
  } catch (e) {
    throw new Error('Invalid JSON string provided to sanitizeLexicalState')
  }

  function sanitizeNode(node: any) {
    if (node && typeof node === 'object') {
      // Sanitize the style property
      if (typeof node.style === 'string') {
        node.style = sanitizeInlineStyle(node.style)
      }

      // Also sanitize the textStyle property if present
      if (typeof node.textStyle === 'string') {
        node.textStyle = sanitizeInlineStyle(node.textStyle)
      }

      for (const key of Object.keys(node)) {
        if (Array.isArray(node[key])) {
          node[key].forEach((childNode: any) => sanitizeNode(childNode))
        } else if (typeof node[key] === 'object' && node[key] !== null) {
          sanitizeNode(node[key])
        }
      }
    }
  }

  sanitizeNode(state)

  return JSON.stringify(state)
}

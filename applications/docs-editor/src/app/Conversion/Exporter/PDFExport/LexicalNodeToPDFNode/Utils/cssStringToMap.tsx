export const cssStringToMap = (cssString: string): Record<string, unknown> => {
  const properties = cssString.split(';')
  const styleMap: Record<string, string> = {}

  properties.forEach((property) => {
    const [key, value] = property.split(':')
    if (key && value) {
      styleMap[key.trim()] = value.trim()
    }
  })

  return styleMap
}

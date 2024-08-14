export function pxToNumber(value: string | undefined | null): number | null {
  if (!value) {
    return null
  }

  const numberValue = parseFloat(value)

  if (!isNaN(numberValue) && value.endsWith('px')) {
    return numberValue
  }

  return null
}

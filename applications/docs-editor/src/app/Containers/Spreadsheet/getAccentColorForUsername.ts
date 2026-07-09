import tinycolor from 'tinycolor2'

const ACCENT_COLORS = [
  '#8080FF',
  '#DB60D6',
  '#EC3E7C',
  '#F78400',
  '#936D58',
  '#5252CC',
  '#A839A4',
  '#BA1E55',
  '#C44800',
  '#54473F',
  '#415DF0',
  '#179FD9',
  '#1DA583',
  '#3CBB3A',
  '#B4A40E',
  '#273EB2',
  '#0A77A6',
  '#0F735A',
  '#258723',
  '#807304',
]

export const ACCENT_COLORS_IN_HSL = ACCENT_COLORS.map((color) => tinycolor(color).toHslString())

export function getAccentColorForUsername(name: string) {
  const factor = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const index = factor % ACCENT_COLORS_IN_HSL.length
  const color = ACCENT_COLORS_IN_HSL[index]
  return color
}

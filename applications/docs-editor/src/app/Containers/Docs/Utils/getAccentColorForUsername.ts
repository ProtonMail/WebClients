import tinycolor from 'tinycolor2'

// Keep the order and values aligned with the existing Proton avatar palette so
// collaborator cursors retain their colors when Docs runs without the shell.
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
] as const

const ACCENT_COLORS_IN_HSL = ACCENT_COLORS.map((color) => tinycolor(color).toHslString())

export function getAccentColorForUsername(name: string): string {
  const factor = name.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0)
  return ACCENT_COLORS_IN_HSL[factor % ACCENT_COLORS_IN_HSL.length]
}

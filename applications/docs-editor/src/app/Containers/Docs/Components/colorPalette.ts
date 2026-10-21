import tinycolor from 'tinycolor2'

// Keep the hexes aligned with ACCENT_COLORS_MAP in packages/shared/lib/colors.ts and genShades with
// packages/colors/gen-accent-shades.ts, so text and highlight colors match the rest of Proton.
export const accentColors = {
  purple: '#8080FF',
  pink: '#DB60D6',
  carrot: '#F78400',
  enzian: '#5252CC',
  slateblue: '#415DF0',
  pacific: '#179FD9',
  reef: '#1DA583',
  olive: '#B4A40E',
}

export function genShades(color: string) {
  const base = tinycolor(color)
  const { h, s, l } = base.toHsl()
  const intense = tinycolor({ h, s: Math.max(0, s - 0.1), l: Math.max(0, l - 0.1) })

  return {
    base: base.toRgbString(),
    intense: intense.toRgbString(),
    lowOpacity: base.setAlpha(0.15).toRgbString(),
  }
}

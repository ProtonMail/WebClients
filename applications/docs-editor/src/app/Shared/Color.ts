import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors'
import tinycolor from 'tinycolor2'

export const TextColors = [
  '#0C0C14',
  '#5C5958',
  '#6D4AFF',
  ACCENT_COLORS_MAP.pacific.color,
  ACCENT_COLORS_MAP.carrot.color,
  ACCENT_COLORS_MAP.olive.color,
  ACCENT_COLORS_MAP.reef.color,
  '#DC3251',
  ACCENT_COLORS_MAP.pink.color,
  ACCENT_COLORS_MAP.sahara.color,
]

export const BackgroundColors = ([null] as (string | null)[]).concat(
  TextColors.map((color) => tinycolor(color).setAlpha(0.15).toRgbString()),
)

import { ACCENT_COLORS_MAP } from '@proton/shared/lib/colors'
import tinycolor from 'tinycolor2'
import { c } from 'ttag'

export const TextColors: [() => string, string][] = [
  [() => c('color').t`black`, '#0C0C14'],
  [() => c('color').t`gray`, '#5C5958'],
  [() => c('color').t`purple`, '#6D4AFF'],
  [ACCENT_COLORS_MAP.pacific.getName, ACCENT_COLORS_MAP.pacific.color],
  [ACCENT_COLORS_MAP.carrot.getName, ACCENT_COLORS_MAP.carrot.color],
  [ACCENT_COLORS_MAP.olive.getName, ACCENT_COLORS_MAP.olive.color],
  [ACCENT_COLORS_MAP.reef.getName, ACCENT_COLORS_MAP.reef.color],
  [() => c('color').t`red`, '#DC3251'],
  [ACCENT_COLORS_MAP.pink.getName, ACCENT_COLORS_MAP.pink.color],
  [ACCENT_COLORS_MAP.sahara.getName, ACCENT_COLORS_MAP.sahara.color],
]

export const BackgroundColors: [() => string, string | null][] = [
  [() => c('Action').t`Remove background color`, null],
  ...TextColors.slice(1).map(
    ([name, color]) => [name, tinycolor(color).setAlpha(0.15).toRgbString()] as [() => string, string],
  ),
]

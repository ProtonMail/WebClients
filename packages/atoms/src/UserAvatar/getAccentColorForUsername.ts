import tinycolor from 'tinycolor2';

import { ACCENT_COLORS } from '@proton/shared/lib/colors';

export const ACCENT_COLORS_IN_HSL = ACCENT_COLORS.map((color) => tinycolor(color).toHslString());

export function getAccentColorForUsername(name: string) {
    const factor = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = factor % ACCENT_COLORS_IN_HSL.length;
    const color = ACCENT_COLORS_IN_HSL[index];
    return color;
}

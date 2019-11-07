import tinycolor from 'tinycolor2';

import { COLORS } from '../constants';

/**
 * Pick best color to contrast with background
 * @param {String} backgroundColor
 * @returns {String} COLORS.BLACK, COLORS.WHITE
 */
export const bestColor = (backgroundColor = '') => {
    const colorModel = tinycolor(backgroundColor);
    return colorModel.isLight() ? COLORS.BLACK : COLORS.WHITE;
};

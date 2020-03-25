import tinycolor from 'tinycolor2';

import { COLORS } from '../constants';

export const getConstrastingColor = (backgroundColor = '') => {
    const colorModel = tinycolor(backgroundColor) as any;
    return colorModel.isLight() ? COLORS.BLACK : COLORS.WHITE;
};

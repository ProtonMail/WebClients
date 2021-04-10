import { CSSProperties } from 'react';
import tinycolor from 'tinycolor2';

import { COLORS } from 'proton-shared/lib/calendar/constants';

export const getConstrastingColor = (backgroundColor = '') => {
    const colorModel = tinycolor(backgroundColor) as any;
    return colorModel.isLight() ? COLORS.BLACK : COLORS.WHITE;
};

export const getEventStyle = (backgroundColor = '', style: CSSProperties = {}) => {
    const colorAlt = (tinycolor(backgroundColor) as any).darken(12);
    const colorAlpha = (tinycolor(backgroundColor) as any).setAlpha(0.3);

    return {
        ...style,
        '--color-main': backgroundColor,
        '--color-alt': colorAlt,
        '--color-alpha': colorAlpha,
        '--foreground': getConstrastingColor(backgroundColor),
    };
};

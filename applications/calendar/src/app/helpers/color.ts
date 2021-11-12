import { CSSProperties } from 'react';
import tinycolor from 'tinycolor2';

import { COLORS } from '@proton/shared/lib/calendar/constants';

export const getMostReadableColor = (backgroundColor = '') => {
    return tinycolor
        .mostReadable(backgroundColor, [COLORS.BLACK, COLORS.WHITE], {
            includeFallbackColors: false,
            level: 'AAA',
            size: 'small',
        })
        .toHexString();
};

export const getEventStyle = (backgroundColor = '', style: CSSProperties = {}) => {
    const colorAlt = tinycolor(backgroundColor)?.darken(12);
    const colorAlpha = tinycolor(backgroundColor)?.setAlpha(0.3);

    return {
        ...style,
        '--color-main': backgroundColor,
        '--color-alt': colorAlt,
        '--color-alpha': colorAlpha,
        '--foreground': getMostReadableColor(backgroundColor),
    };
};

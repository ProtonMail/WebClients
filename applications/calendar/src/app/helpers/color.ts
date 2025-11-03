import type { CSSProperties } from 'react';

import tinycolor from 'tinycolor2';

import { genAccentShades } from '@proton/colors';
import { COLORS } from '@proton/shared/lib/calendar/constants';

export const getEventStyle = (backgroundColor = '', style: CSSProperties = {}) => {
    const [base, alt] = genAccentShades(tinycolor(backgroundColor)).map((c) => c.toHexString());
    const alpha = tinycolor(backgroundColor)?.setAlpha(0.3);

    return {
        ...style,
        '--color-main': base,
        '--color-alt': alt,
        '--color-alpha': alpha,
        '--foreground': COLORS.WHITE,
    };
};

export const getBookingSlotStyle = (backgroundColor = '', style: CSSProperties = {}): CSSProperties => {
    const [base, alt] = genAccentShades(tinycolor(backgroundColor)).map((c) => c.toHexString());

    return {
        ...style,
        '--color-alt': alt,
        '--alt-inline-start-width': '1px',
        '--color-main': 'transparent',
        '--alt-border-width': '2px',
        '--alt-border-radius': '1em',
        '--booking-cell-background': base,
    };
};

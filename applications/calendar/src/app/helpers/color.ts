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
    return {
        ...style,
        '--color-alt': backgroundColor,
        '--alt-inline-start-width': '1px',
        '--color-main': 'var(--background-norm)',
        '--alt-border-width': '2px',
        '--alt-border-radius': '0.5em',
    };
};

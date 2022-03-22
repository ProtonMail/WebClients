import { CSSProperties } from 'react';
import tinycolor from 'tinycolor2';
import { COLORS } from '@proton/shared/lib/calendar/constants';

import { genAccentShades } from '@proton/colors';

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

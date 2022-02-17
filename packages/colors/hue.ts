import tinycolor, { Instance as Color } from 'tinycolor2';

import percentOf from '@proton/shared/lib/helpers/percentOf';

function hue(color: Color, percent: number) {
    const hsl = color.toHsl();

    hsl.h = hsl.h + percentOf(percent, hsl.h);

    return tinycolor(hsl);
}

export default hue;

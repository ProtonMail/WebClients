import tiny, { Instance as Color } from 'tinycolor2';

import percentOf from '@proton/utils/percentOf';

function shade(color: Color, percent: number) {
    const rgb = color.toRgb();

    rgb.r = percentOf(100 - percent, rgb.r);
    rgb.g = percentOf(100 - percent, rgb.g);
    rgb.b = percentOf(100 - percent, rgb.b);

    return tiny(rgb);
}

export default shade;

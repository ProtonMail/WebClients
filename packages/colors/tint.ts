import tiny, { Instance as Color } from 'tinycolor2';

import percentOf from '@proton/utils/percentOf';

function tint(color: Color, percent: number) {
    const rgb = color.toRgb();

    rgb.r = rgb.r + percentOf(percent, 255 - rgb.r);
    rgb.g = rgb.g + percentOf(percent, 255 - rgb.g);
    rgb.b = rgb.b + percentOf(percent, 255 - rgb.b);

    return tiny(rgb);
}

export default tint;

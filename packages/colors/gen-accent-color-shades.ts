import { Instance as Color } from 'tinycolor2';

import shade from './shade';
import tint from './tint';
function genMutation(color: Color) {
    return function (mutation: number) {
        const clone = color.clone();

        return mutation > 0 ? tint(clone, mutation) : shade(clone, Math.abs(mutation));
    };
}

function getAccentColorShades(base: Color) {
    return [ 20, 40 ].map(genMutation(base))
}

export default getAccentColorShades;

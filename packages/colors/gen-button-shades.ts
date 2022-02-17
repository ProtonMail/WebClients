import tinycolor, { Instance as Color } from 'tinycolor2';

import isBetween from '@proton/shared/lib/helpers/isBetween';

import shade from './shade';
import tint from './tint';
import hue from './hue';

function genMutation(color: Color) {
    return function (mutation: number) {
        const clone = color.clone();

        return mutation > 0 ? tint(clone, mutation) : shade(clone, Math.abs(mutation));
    };
}

function genButtonShades(base: Color) {
    const hsl = base.toHsl();

    if (hsl.s <= 0.3) {
        return [70, 50, 0, -5, -10, -15].map(genMutation(base));
    }

    if (isBetween(hsl.h, 30, 60)) {
        const tinted = [90, 80, 0].map(genMutation(base));

        const shaded = [-5, -10, -15].map(genMutation(base)).map((c) => hue(c, -5));

        return tinted.concat(shaded);
    }

    return [90, 80, 0, -10, -20, -30].map(genMutation(base));
}

export default genButtonShades;

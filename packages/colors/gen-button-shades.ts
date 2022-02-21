import { Instance as Color } from 'tinycolor2';

import isBetween from '@proton/shared/lib/helpers/isBetween';

import shade from './shade';
import tint from './tint';
import hue from './hue';

function genMutation(color: Color) {
    return function (mutation: number) {
        const clone = color.clone();

        return (mutation > 0 ? tint(clone, mutation) : shade(clone, Math.abs(mutation)));
    };
}

function genButtonShades(base: Color, light: boolean) {
    const hsl = base.toHsl();

    if (hsl.s <= 0.3) {
        if (light) {
            return [70, 50, 0, -5, -10, -15].map(genMutation(base))
        } else {
            return [-70, -50, 0, 10, 20, 30].map(genMutation(base))
        }
    }

    if (isBetween(hsl.h, 30, 60)) {
        if (light) {
            const tinted = [90, 80, 0].map(genMutation(base));
    
            const shaded = [-5, -10, -15].map(genMutation(base)).map(hue(-5));
    
            return [ ...tinted, ...shaded ];
        } else {
            const shaded = [-80, -70, 0].map(genMutation(base)).map(hue(-5));
            
            const tinted = [10, 20, 30].map(genMutation(base));
    
            return [ ...shaded, ...tinted ];
        }
    }

    if (light) {
        return [90, 80, 0, -10, -20, -30].map(genMutation(base));
    } else {
        return [-80, -70, 0, 10, 20, 30].map(genMutation(base));
    }
}

export default genButtonShades;

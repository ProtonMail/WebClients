import tinycolor, { Instance as Color } from 'tinycolor2';

function genAccentColorShades(base: Color) {
    const hsl = base.toHsl();

    return [
        base,
        tinycolor({
            h: hsl.h,
            s: Math.max(0, hsl.s - 0.05),
            l: Math.max(0, hsl.l - 0.05),
        }),
        tinycolor({
            h: hsl.h,
            s: Math.max(0, hsl.s - 0.1),
            l: Math.max(0, hsl.l - 0.1),
        }),
    ];
}

export default genAccentColorShades;

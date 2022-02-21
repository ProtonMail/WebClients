import tinycolor, { Instance as Color } from 'tinycolor2';

function getAccentColorShades(base: Color) {
    const hsl = base.toHsl()

    return [
        base,
        tinycolor({
            h: Math.max(0, hsl.h - 6),
            s: Math.max(0, hsl.s - 0.1),
            l: Math.max(0, hsl.l - 0.1)
        }),
        tinycolor({
            h: Math.max(0, hsl.h - 8),
            s: Math.max(0, hsl.s - 0.1),
            l: Math.max(0, hsl.l - 0.17)
        })
    ]
}

export default getAccentColorShades;

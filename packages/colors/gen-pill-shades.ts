import tinycolor, { Instance as Color } from 'tinycolor2';

export function genPillTextColorShades(base: Color) {
    const hsl = base.toHsl();

    const lightBackground = tinycolor({
        h: hsl.h,
        s: Math.min(1, hsl.s * 1.3),
        l: 0.94,
    });

    const darkBackground = tinycolor({
        h: hsl.h,
        s: Math.min(1, hsl.s * 1.05),
        l: 0.3,
    });

    return [
        base,
        tinycolor.mostReadable(base, [lightBackground, darkBackground], {
            includeFallbackColors: false,
            level: 'AA',
            size: 'small',
        }),
    ];
}

export function genPillBackgroundColorShades(base: Color) {
    const hsl = base.toHsl();

    const lightText = tinycolor({
        h: hsl.h,
        s: Math.min(1, hsl.s * 1.05),
        l: 0.95,
    });

    const darkText = tinycolor({
        h: hsl.h,
        s: 1,
        l: 0.2,
    });

    return [
        tinycolor.mostReadable(base, [lightText, darkText], {
            includeFallbackColors: false,
            level: 'AA',
            size: 'small',
        }),
        base,
    ];
}

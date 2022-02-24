import tinycolor, { Instance as Color } from 'tinycolor2';

import genAccentShades from './gen-accent-shades';

const getOriginal = (c: Color) => c.getOriginalInput();

describe('genAccentShades', () => {
    it('generates the necessary shades for an accent color', () => {
        const output = genAccentShades(tinycolor({ h: 240, s: 1, l: 0.75 }));

        expect(output.map(getOriginal)).toEqual([
            { h: 240, s: 1, l: 0.75 },
            { h: 234, s: 0.9, l: 0.65 },
            { h: 232, s: 0.9, l: 0.58 },
        ]);
    });

    it("doesn't allow values to drop below 0", () => {
        const output = genAccentShades(tinycolor({ h: 5, s: 5, l: 5 }));

        expect(output.map(getOriginal)).toEqual([
            { h: 5, s: 5, l: 5 },
            { h: 0, s: 0, l: 0 },
            { h: 0, s: 0, l: 0 },
        ]);
    });
});

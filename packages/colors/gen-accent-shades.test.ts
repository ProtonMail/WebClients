import tinycolor, { Instance as Color } from 'tinycolor2';

import genAccentShades from './gen-accent-shades';

const getOriginal = (c: Color) => c.getOriginalInput();

describe('genAccentShades', () => {
    it('generates the necessary shades for an accent color', () => {
        const output = genAccentShades(tinycolor({ h: 240, s: 1, l: 0.75 }));

        expect(output.map(getOriginal)).toEqual([
            { h: 240, s: 1, l: 0.75 },
            { h: 240, s: 0.95, l: 0.7 },
            { h: 240, s: 0.9, l: 0.65 },
        ]);
    });

    it("doesn't allow values to drop below 0", () => {
        const output = genAccentShades(tinycolor({ h: 100, s: 0.01, l: 0.01 }));

        expect(output.map(getOriginal)).toEqual([
            { h: 100, s: 0.01, l: 0.01 },
            { h: 100, s: 0, l: 0 },
            { h: 100, s: 0, l: 0 },
        ]);
    });
});

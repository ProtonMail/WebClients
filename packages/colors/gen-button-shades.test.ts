import tinycolor from 'tinycolor2';

import genButtonShades from './gen-button-shades';

describe('genButtonShades', () => {
    it('generates the necessary shades for a button', () => {
        const output = genButtonShades(tinycolor('#6d4aff'), true);

        expect(output.map((c) => c.toHexString())).toEqual([
            '#f0edff',
            '#e2dbff',
            '#6d4aff',
            '#6243e6',
            '#573bcc',
            '#4c34b3',
        ]);
    });

    it("generates the necessary button shades when the color's hue is between 30 & 60", () => {
        const output = genButtonShades(tinycolor('#ff9900'), true);

        expect(output.map((c) => c.toHexString())).toEqual([
            '#fff5e6',
            '#ffebcc',
            '#ff9900',
            '#f27d00',
            '#e66300',
            '#d94c00',
        ]);
    });

    it("generates the necessary button shades when the color's saturation is less than or equal to 30", () => {
        const output = genButtonShades(tinycolor('#eae7e4'), true);

        expect(output.map((c) => c.toHexString())).toEqual([
            '#f9f8f7',
            '#f5f3f2',
            '#eae7e4',
            '#dedbd9',
            '#d3d0cd',
            '#c7c4c2',
        ]);
    });
});

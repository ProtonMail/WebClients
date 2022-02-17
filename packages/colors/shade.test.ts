import tinycolor from 'tinycolor2';

import shade from './shade';

describe('shade', () => {
    it('shades a color', () => {
        /* in steps of 10 from 0 to 100*/
        const expectedByBase = {
            '#6d4aff': [
                '#6d4aff',
                '#6243e6',
                '#573bcc',
                '#4c34b3',
                '#412c99',
                '#372580',
                '#2c1e66',
                '#21164d',
                '#160f33',
                '#0b071a',
                '#000000',
            ],
            '#DB3251': [
                '#db3251',
                '#c52d49',
                '#af2841',
                '#992339',
                '#831e31',
                '#6e1929',
                '#581420',
                '#420f18',
                '#2c0a10',
                '#160508',
                '#000000',
            ],
        };

        for (const [input, outputs] of Object.entries(expectedByBase)) {
            for (const [index, expected] of Object.entries(outputs)) {
                const output = shade(tinycolor(input), Number(index) * 10);

                expect(output.toHexString()).toBe(expected);
            }
        }
    });
});

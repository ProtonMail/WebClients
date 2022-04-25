import tinycolor from 'tinycolor2';

import tint from './tint';

describe('tint', () => {
    it('tints a color', () => {
        /* in steps of 10 from 0 to 100*/
        const expectedByBase = {
            '#6d4aff': [
                '#6d4aff',
                '#7c5cff',
                '#8a6eff',
                '#9980ff',
                '#a792ff',
                '#b6a5ff',
                '#c5b7ff',
                '#d3c9ff',
                '#e2dbff',
                '#f0edff',
                '#ffffff',
            ],
            '#db3251': [
                '#db3251',
                '#df4762',
                '#e25b74',
                '#e67085',
                '#e98497',
                '#ed99a8',
                '#f1adb9',
                '#f4c2cb',
                '#f8d6dc',
                '#fbebee',
                '#ffffff',
            ],
        };

        for (const [input, outputs] of Object.entries(expectedByBase)) {
            for (const [index, expected] of Object.entries(outputs)) {
                const output = tint(tinycolor(input), Number(index) * 10);

                expect(output.toHexString()).toBe(expected);
            }
        }
    });
});

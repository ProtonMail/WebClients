import { scaleChartFontSize } from './scaleChartFontSize';

describe('scaleChartFontSize', () => {
    beforeEach(() => {
        document.documentElement.style.fontSize = '16px';
    });

    afterEach(() => {
        document.documentElement.style.fontSize = '';
    });

    it('returns the design px size at the default root font size', () => {
        expect(scaleChartFontSize(14, true)).toBe(14);
        expect(scaleChartFontSize(11, true)).toBe(11);
    });

    it('scales proportionally when the root font size changes', () => {
        document.documentElement.style.fontSize = '20px';

        expect(scaleChartFontSize(14, true)).toBe(17.5);
        expect(scaleChartFontSize(10, true)).toBe(12.5);
    });
});

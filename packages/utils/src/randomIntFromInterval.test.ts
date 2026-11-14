import { vi } from 'vitest';

import randomIntFromInterval from './randomIntFromInterval';

describe('randomIntFromInterval()', () => {
    it('should be able to return min', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const min = 1;
        const max = 100;

        const result = randomIntFromInterval(min, max);

        expect(result).toBe(min);
    });

    it('should be able to return max', () => {
        vi.spyOn(Math, 'random').mockReturnValue(
            // Math.random does not output 1
            0.9999999999999999
        );
        const min = 1;
        const max = 100;

        const result = randomIntFromInterval(min, max);

        expect(result).toBe(max);
    });

    it('should return an evenish distribution', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const min = 1;
        const max = 100;

        const result = randomIntFromInterval(min, max);

        expect(result).toBe(51);
    });
});

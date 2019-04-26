import { randomIntFromInterval } from '../../lib/helpers/function';

describe('Functions', () => {
    describe('Random int', () => {
        it('should generate random integers in range', () => {
            const list = Array.from({ length: 100 }, () => randomIntFromInterval(1, 100));
            const test = list.some((n) => n < 1 || n > 100);
            expect(test).toEqual(false);
        });
    });
});

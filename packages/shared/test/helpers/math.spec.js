import { clamp, mod, withDecimalPrecision } from '../../lib/helpers/math';

describe('math', () => {
    describe('withDecimalPrecision', () => {
        it('should return the same number when the precision is infinity', () => {
            const list = [2.234, 5, 381712.0001, -1, -1.38, -0.99, -10282.12312];
            expect(list.map((x) => withDecimalPrecision(x, Infinity))).toEqual(list);
        });

        it('should be equivalent to round when the precision is zero', () => {
            const list = [2.234, 5, 0, -1, -1.38, -0.99, -10282.12312];
            expect(list.map((x) => withDecimalPrecision(x, 0))).toEqual(list.map(Math.round));
        });

        it('should return 0 when the precision is minus infinity', () => {
            const list = [2.234, 5, 0, -1, -1.38, -0.99, -10282.12312];
            expect(list.map((x) => withDecimalPrecision(x, -Infinity))).toEqual(list.map(() => 0));
        });

        it('should return the expected values for some simple cases', () => {
            const list = [122.234, 5, -0.54, -1, -1.387, 12.4491];
            expect(list.map((x, i) => withDecimalPrecision(x, i - 2))).toEqual([100, 10, -1, -1, -1.39, 12.449]);
        });
    });

    describe('clamp', () => {
        it('should clamp a number', () => {
            expect(clamp(0, 1, 10)).toBe(1);
            expect(clamp(1, 1, 10)).toBe(1);
            expect(clamp(2, 1, 10)).toBe(2);
            expect(clamp(20, 1, 10)).toBe(10);
        });
    });

    describe('mod', () => {
        it('should return a positive remainder', () => {
            expect(mod(-4, 3)).toEqual(2);
            expect(mod(-3, 3)).toEqual(0);
            expect(mod(-2, 3)).toEqual(1);
            expect(mod(-1, 3)).toEqual(2);
            expect(mod(0, 3)).toEqual(0);
            expect(mod(1, 3)).toEqual(1);
            expect(mod(2, 3)).toEqual(2);
            expect(mod(3, 3)).toEqual(0);
            expect(mod(4, 3)).toEqual(1);
        });
    });
});

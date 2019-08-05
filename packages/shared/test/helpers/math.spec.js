import { withDecimalPrecision } from '../../lib/helpers/math';

describe('math', () => {
    describe('withDecimalPrecision', () => {
        it('should return the same number when the precision is infinity', () => {
            const list = [2.234, 5, 381712.0001, -1, -1.38, -0.99, -10282.12312];
            expect(list.map((x) => withDecimalPrecision(x, Infinity))).toEqual(list);
        });
    });

    describe('withDecimalPrecision', () => {
        it('should be equivalent to round when the precision is zero', () => {
            const list = [2.234, 5, 0, -1, -1.38, -0.99, -10282.12312];
            expect(list.map((x) => withDecimalPrecision(x, 0))).toEqual(list.map(Math.round));
        });
    });

    describe('withDecimalPrecision', () => {
        it('should return 0 when the precision is minus infinity', () => {
            const list = [2.234, 5, 0, -1, -1.38, -0.99, -10282.12312];
            expect(list.map((x) => withDecimalPrecision(x, -Infinity))).toEqual(list.map(() => 0));
        });
    });

    describe('withDecimalPrecision', () => {
        it('should return the expected values for some simple cases', () => {
            const list = [122.234, 5, -0.54, -1, -1.387, 12.4491];
            expect(list.map((x, i) => withDecimalPrecision(x, i - 2))).toEqual([100, 10, -1, -1, -1.39, 12.449]);
        });
    });
});

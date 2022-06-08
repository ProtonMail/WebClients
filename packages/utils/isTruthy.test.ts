import isTruthy from './isTruthy';

describe('isTruthy()', () => {
    it('tells whether a value is JavaScript "truthy" or not', () => {
        expect(isTruthy(false)).toBe(false);
        expect(isTruthy(null)).toBe(false);
        expect(isTruthy(0)).toBe(false);
        expect(isTruthy(undefined)).toBe(false);

        expect(isTruthy([])).toBe(true);
        expect(isTruthy({})).toBe(true);
        expect(isTruthy(true)).toBe(true);
        expect(isTruthy(1)).toBe(true);
        expect(isTruthy(-1)).toBe(true);
    });
});

import range from './range';

describe('range()', () => {
    it('defaults to creating a specific array if no arguments are provided', () => {
        expect(range()).toEqual([0]);
    });

    it('returns an empty array if end is before start', () => {
        expect(range(10, 2)).toEqual([]);
    });

    it('returns an empty array if end is same as start', () => {
        expect(range(2, 2)).toEqual([]);
    });

    // Here closed is the mathematical definition
    it('has a closed start', () => {
        const start = 0;
        const result = range(start, 2);
        expect(result[0]).toEqual(start);
    });

    // Here open is the mathematical definition
    it('has an open end', () => {
        const end = 2;
        const result = range(0, end);
        expect(result[result.length - 1]).toBeLessThan(end);
    });

    it('returns range with correct step', () => {
        expect(range(-4, 5, 2)).toEqual([-4, -2, 0, 2, 4]);
        expect(range(0, 2, 0.5)).toEqual([0, 0.5, 1, 1.5]);
    });
});

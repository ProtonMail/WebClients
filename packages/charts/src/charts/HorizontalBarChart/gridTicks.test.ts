import { gridTicks } from './gridTicks';

const values = (...args: Parameters<typeof gridTicks>) => gridTicks(...args).map(({ value }) => value);

describe('gridTicks', () => {
    it('rules the quarters of a span, both ends included', () => {
        expect(values(0, 100, 5)).toEqual([0, 25, 50, 75, 100]);
    });

    it('rules a span that does not start at zero', () => {
        expect(values(20, 60, 3)).toEqual([20, 40, 60]);
    });

    it('rules the ends alone where that is all a caller asks for', () => {
        expect(values(0, 100, 2)).toEqual([0, 100]);
    });

    it('rules nothing where a line would have nowhere to be', () => {
        expect(values(0, 100, 1)).toEqual([]);
        expect(values(0, 100, 0)).toEqual([]);
        expect(values(100, 100, 5)).toEqual([]);
        expect(values(100, 0, 5)).toEqual([]);
    });
});

import percentOf from './percentOf';

describe('percentOf()', () => {
    it('returns the value of a percentage of another value', () => {
        const output = percentOf(10, 200);

        expect(output).toBe(20);
    });

    it("returns a decimal in case the percentage can't be resolved in integers", () => {
        const output = percentOf(2.5, 10);

        expect(Math.round(output)).not.toBe(output);
    });
});

import percentage from './percentage';

describe('percentage()', () => {
    it('returns the percentage between an entire and a fraction', () => {
        const output = percentage(500, 100);

        expect(output).toBe(20);
    });

    it("returns a decimal in case the percentage can't be resolved in integers", () => {
        const output = percentage(30, 10);

        expect(Math.round(output)).not.toBe(output);
    });

    it('returns 0 if either inputs are 0', () => {
        expect(percentage(0, 1)).toBe(0);
        expect(percentage(1, 0)).toBe(0);
    });
});

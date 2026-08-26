import shallowEqual from './shallowEqual';

describe('shallowEqual()', () => {
    it('returns true when comparing 2 empty arrays', () => {
        const result = shallowEqual([], []);

        expect(result).toBe(true);
    });

    it('returns true if arrays contain the same items', () => {
        const result = shallowEqual(['item 0', 'item 1', 'item 2'], ['item 0', 'item 1', 'item 2']);

        expect(result).toBe(true);
    });

    it('returns false if arrays are different lengths', () => {
        const result = shallowEqual([], ['item 0']);

        expect(result).toBe(false);
    });

    it('returns false if arrays contain different items', () => {
        const result = shallowEqual(['item 0', 'item 1', 'item 2'], ['item 0', 'DIFFERENT item 1', 'item 2']);

        expect(result).toBe(false);
    });
});

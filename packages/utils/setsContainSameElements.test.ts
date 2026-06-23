import setsContainSameElements from './setsContainSameElements';

describe('setsContainSameElements()', () => {
    it('returns true for empty sets', () => {
        const result = setsContainSameElements(new Set(), new Set());

        expect(result).toBeTruthy();
    });

    it('returns false if sets are of different size', () => {
        const set1 = new Set(['item 1', 'item 2', 'item 3']);
        const set2 = new Set(['item 1', 'item 2']);

        const result = setsContainSameElements(set1, set2);

        expect(result).toBeFalsy();
    });

    it('returns false if sets are of the same size but contain different elements', () => {
        const set1 = new Set(['item 1', 'item 2', 'item 3']);
        const set2 = new Set(['item 1', 'item 2', 'item 4']);

        const result = setsContainSameElements(set1, set2);

        expect(result).toBeFalsy();
    });

    it('returns true if items are the same and are in the same order', () => {
        const set1 = new Set(['item 1', 'item 2', 'item 3']);
        const set2 = new Set(['item 1', 'item 2', 'item 3']);

        const result = setsContainSameElements(set1, set2);

        expect(result).toBeTruthy();
    });

    it('returns true if items are the same but out of order', () => {
        const set1 = new Set(['item 1', 'item 2', 'item 3']);
        const set2 = new Set(['item 1', 'item 3', 'item 2']);

        const result = setsContainSameElements(set1, set2);

        expect(result).toBeTruthy();
    });
});

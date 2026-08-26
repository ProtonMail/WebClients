import arraysContainSameElements from './arraysContainSameElements';

describe('arraysContainSameElements()', () => {
    it('returns true for empty arrays', () => {
        const result = arraysContainSameElements([], []);

        expect(result).toBeTruthy();
    });

    it('returns false if arrays are of different length', () => {
        const array1 = ['item 1', 'item 2', 'item 3'];
        const array2 = ['item 1', 'item 2'];

        const result = arraysContainSameElements(array1, array2);

        expect(result).toBeFalsy();
    });

    it('returns true if items are the same and are in the same order', () => {
        const array1 = ['item 1', 'item 2', 'item 3'];
        const array2 = ['item 1', 'item 2', 'item 3'];

        const result = arraysContainSameElements(array1, array2);

        expect(result).toBeTruthy();
    });

    it('returns true if items are the same but out of order', () => {
        const array1 = ['item 1', 'item 2', 'item 3'];
        const array2 = ['item 1', 'item 3', 'item 2'];

        const result = arraysContainSameElements(array1, array2);

        expect(result).toBeTruthy();
    });
});

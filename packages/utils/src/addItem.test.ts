import addItem from './addItem';

describe('addItem()', () => {
    it('adds item to empty array', () => {
        const item = 'item to add';

        const result = addItem([], item);

        expect(result).toStrictEqual([item]);
    });

    it('appends item to ends of array', () => {
        const array = ['item 1', 'item 2', 'item 3'];
        const item = 'item to add';

        const result = addItem(array, item);

        expect(result).toStrictEqual([...array, item]);
    });
});

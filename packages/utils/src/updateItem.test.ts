import updateItem from './updateItem';

describe('updateItem()', () => {
    it('returns empty array if array is empty', () => {
        const array: any[] = [];
        const index = 1;
        const newItem = 'new item';

        const result = updateItem(array, index, newItem);

        expect(result).toStrictEqual([]);
    });

    it('updates correct item', () => {
        const array = ['item 0', 'item 1', 'item 2'];
        const index = 1;
        const newItem = 'new item';

        const result = updateItem(array, index, newItem);

        expect(result).toStrictEqual(['item 0', 'new item', 'item 2']);
    });

    it('does not update array if index does not exist', () => {
        const array = ['item 0', 'item 1', 'item 2'];
        const index = -1;
        const newItem = 'new item';

        const result = updateItem(array, index, newItem);

        expect(result).toStrictEqual(array);
    });
});

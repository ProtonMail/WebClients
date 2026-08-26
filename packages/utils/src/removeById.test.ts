import { removeById } from './removeById';

describe('removeById', () => {
    it('should remove an item by ID if it exists in the list', () => {
        const list = [
            { ID: '1', name: 'Item 1' },
            { ID: '2', name: 'Item 2' },
        ];
        const value = { ID: '1' };
        const result = removeById(list, value, 'ID');
        expect(result).toEqual([{ ID: '2', name: 'Item 2' }]);
    });

    it('should return the same list if the item does not exist', () => {
        const list = [
            { ID: '1', name: 'Item 1' },
            { ID: '2', name: 'Item 2' },
        ];
        const value = { ID: '3' };
        const result = removeById(list, value, 'ID');
        expect(result).toEqual(list);
    });
});

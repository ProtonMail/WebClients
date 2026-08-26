import { upsertById } from './upsertById';

describe('upsert', () => {
    it('should add a new item if it does not exist in the list', () => {
        const list = [{ ID: '1', name: 'Item 1' }];
        const newItem = { ID: '2', name: 'Item 2' };
        const result = upsertById(list, newItem, 'ID');
        expect(result).toEqual([
            { ID: '1', name: 'Item 1' },
            { ID: '2', name: 'Item 2' },
        ]);
    });

    it('should replace an existing item if it exists in the list', () => {
        const list = [{ ID: '1', name: 'Item 1' }];
        const updatedItem = { ID: '1', name: 'Updated Item 1' };
        const result = upsertById(list, updatedItem, 'ID');
        expect(result).toEqual([{ ID: '1', name: 'Updated Item 1' }]);
    });
});

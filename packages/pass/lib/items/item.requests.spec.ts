import { createTestItem } from '@proton/pass/lib/items/item.test.utils';

import { batchByShareId, intoRevisionID } from './item.requests';

describe('Item requests', () => {
    describe('batchByShareId', () => {
        const items = [
            createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1 }),
            createTestItem('login', { shareId: 'share1', itemId: 'item2', revision: 2 }),
            createTestItem('login', { shareId: 'share2', itemId: 'item3', revision: 3 }),
        ];

        test('should batch items by `shareId`', () => {
            const batches = batchByShareId(items, (item) => ({ itemId: item.itemId, revision: item.revision }));

            expect(batches).toEqual([
                {
                    shareId: 'share1',
                    items: [
                        { itemId: 'item1', revision: 1 },
                        { itemId: 'item2', revision: 2 },
                    ],
                },
                { shareId: 'share2', items: [{ itemId: 'item3', revision: 3 }] },
            ]);
        });

        test('should handle empty items array', () => {
            const batches = batchByShareId([], (item) => item);
            expect(batches).toEqual([]);
        });
    });

    describe('intoRevisionID', () => {
        const item = createTestItem('login', { shareId: 'share1', itemId: 'item1', revision: 1 });

        test('should convert an item to a revision ID', () => {
            const revisionID = intoRevisionID(item);
            expect(revisionID).toStrictEqual({ ItemID: 'item1', Revision: 1 });
        });
    });
});

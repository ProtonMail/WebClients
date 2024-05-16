import { createTestItem } from '@proton/pass/lib/items/item.test.utils';
import { uniqueId } from '@proton/pass/utils/string/unique-id';

import { updateItem, updateItems, withOptimisticItemsByShareId } from './items';

describe('items reducer', () => {
    const slice = withOptimisticItemsByShareId.reducer(undefined, { type: '__TEST__' });

    const shareA = uniqueId();
    const shareB = uniqueId();

    const login = createTestItem('login', { shareId: shareA });
    const note = createTestItem('note', { shareId: shareA });
    const alias = createTestItem('alias', { shareId: shareB });

    slice[shareA] = { [login.itemId]: login, [note.itemId]: note };
    slice[shareB] = { [alias.itemId]: alias };

    describe('updateItem', () => {
        test('should noop if item does not exist', () => {
            const slice = withOptimisticItemsByShareId.reducer(undefined, { type: '__TEST__' });
            const next = updateItem({ itemId: uniqueId(), shareId: uniqueId(), revision: 2 })(slice);
            expect(next === slice).toBe(true);
            expect(next).toStrictEqual(slice);
        });

        test('should update item if exists', () => {
            const next = updateItem({ itemId: login.itemId, shareId: login.shareId, revision: 2 })(slice);
            expect(next === slice).toBe(false);
            expect(next[shareA]).toStrictEqual({ [login.itemId]: { ...login, revision: 2 }, [note.itemId]: note });
            expect(next[shareB]).toStrictEqual(slice[shareB]);
        });
    });

    describe('updateItems', () => {
        test('should only apply updates to existing items', () => {
            const nonExistingShareId = uniqueId();

            const next = updateItems([
                { itemId: uniqueId(), shareId: nonExistingShareId, revision: 2 },
                { itemId: login.itemId, shareId: login.shareId, revision: 2 },
            ])(slice);

            expect(next[shareA]).toStrictEqual({ [login.itemId]: { ...login, revision: 2 }, [note.itemId]: note });
            expect(next[shareB]).toStrictEqual(slice[shareB]);
            expect(next[nonExistingShareId]).toBeUndefined();
        });
    });
});

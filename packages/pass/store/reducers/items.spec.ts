import { createTestItem } from '../../lib/items/item.test.utils';
import { uniqueId } from '../../utils/string/unique-id';
import { folderDelete } from '../actions';
import itemsReducer, { updateItem, updateItems, withOptimisticItemsByShareId } from './items';

const slice = withOptimisticItemsByShareId.reducer(undefined, { type: '__TEST__' });

const shareA = uniqueId();
const shareB = uniqueId();

const login = createTestItem('login', { shareId: shareA });
const note = createTestItem('note', { shareId: shareA });
const alias = createTestItem('alias', { shareId: shareB });

slice[shareA] = { [login.itemId]: login, [note.itemId]: note };
slice[shareB] = { [alias.itemId]: alias };

describe('`updateItem`', () => {
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

describe('`updateItems`', () => {
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

describe('`folderDelete.success`', () => {
    test('should only remove items in the deleted folders', () => {
        const shareId = uniqueId();
        const root = createTestItem('login', { shareId, folderId: null });
        const a = createTestItem('login', { shareId, folderId: 'folder-a' });
        const b = createTestItem('login', { shareId, folderId: 'folder-b' });
        const c = createTestItem('login', { shareId, folderId: 'folder-c' });

        const state = withOptimisticItemsByShareId.reducer(undefined, { type: '__TEST__' });
        state[shareId] = {
            [root.itemId]: root,
            [a.itemId]: a,
            [b.itemId]: b,
            [c.itemId]: c,
        };

        const next = withOptimisticItemsByShareId.reducer(
            state,
            folderDelete.success('test', { shareId, folderIds: ['folder-a', 'folder-b'] })
        );

        expect(next[shareId]).toStrictEqual({ [root.itemId]: root, [c.itemId]: c });
    });

    test('noops when the share holds no items', () => {
        const next = withOptimisticItemsByShareId.reducer(
            slice,
            folderDelete.success('test', { shareId: uniqueId(), folderIds: ['folder-a'] })
        );

        expect(next[shareA]).toStrictEqual(slice[shareA]);
        expect(next[shareB]).toStrictEqual(slice[shareB]);
    });
});

describe('Items combined reducer', () => {
    test('should combine all sub-reducers correctly', () => {
        const initialState = itemsReducer(undefined, { type: '@@INIT' });
        expect(initialState).toHaveProperty('byShareId');
        expect(initialState).toHaveProperty('byOptimisticId');
        expect(initialState).toHaveProperty('drafts');
        expect(initialState).toHaveProperty('secureLinks');
    });
});

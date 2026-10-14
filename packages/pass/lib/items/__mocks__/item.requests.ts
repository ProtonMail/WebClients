/** In-memory stand-in for the item API: `jest.mock('…/lib/items/item.requests')`.
 * Requests resolve with the revision the server would return, without crypto
 * or network. Anything not overridden here keeps its real implementation. */
import type { Item, ItemCreateIntent, ItemEditIntent, ItemRevision, ItemType, MaybeNull } from '../../../types';
import { createTestItem } from '../../../utils/tests/fixtures/items';

const intoItemData = <T extends ItemType>({ type, metadata, content, extraFields, platformSpecific }: Item<T, any>) =>
    ({ type, metadata, content, extraFields, ...(platformSpecific ? { platformSpecific } : {}) }) as Item<T>;

const createItem = jest.fn(
    async ({ shareId, folderId, ...intent }: ItemCreateIntent<Exclude<ItemType, 'alias'>>): Promise<ItemRevision> =>
        createTestItem(intent.type, { shareId, folderId, data: intoItemData(intent) })
);

const editItem = jest.fn(
    async (
        { shareId, itemId, ...intent }: ItemEditIntent,
        lastRevision: number,
        folderId: MaybeNull<string> = null
    ): Promise<ItemRevision> =>
        createTestItem(intent.type, {
            shareId,
            itemId,
            folderId,
            revision: lastRevision + 1,
            data: intoItemData(intent),
        })
);

const trashItems = jest.fn(async () => []);
const restoreItems = jest.fn(async () => []);

module.exports = { ...jest.requireActual('../item.requests'), createItem, editItem, trashItems, restoreItems };

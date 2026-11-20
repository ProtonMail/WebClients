/** In-memory stand-in for the item API: `vi.mock('…/lib/items/item.requests', …)`.
 * Requests resolve with the revision the server would return, without crypto
 * or network. Exports only the overrides: the spec spreads them over the actual module. */
import type { Item, ItemRevision } from '../../types/data/items';
import type { ItemCreateIntent, ItemEditIntent } from '../../types/data/items.dto';
import type { ItemType } from '../../types/protobuf';
import type { MaybeNull } from '../../types/utils';
import { createTestItem } from '../../utils/tests/fixtures/items';

const intoItemData = <T extends ItemType>({ type, metadata, content, extraFields, platformSpecific }: Item<T, any>) =>
    ({ type, metadata, content, extraFields, ...(platformSpecific ? { platformSpecific } : {}) }) as Item<T>;

export const createItem = vi.fn(
    async ({ shareId, folderId, ...intent }: ItemCreateIntent<Exclude<ItemType, 'alias'>>): Promise<ItemRevision> =>
        createTestItem(intent.type, { shareId, folderId, data: intoItemData(intent) })
);

export const editItem = vi.fn(
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

export const trashItems = vi.fn(async () => []);
export const restoreItems = vi.fn(async () => []);

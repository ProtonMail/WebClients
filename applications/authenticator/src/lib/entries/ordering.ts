import type { AuthenticatorDB } from 'proton-authenticator/lib/db/db';
import type { Item } from 'proton-authenticator/lib/db/entities/items';

/** Represents the positioning of an item during reorder
 * operations, such that `beforeItemId < item < afterItemId`.
 * Note: This representation differs from the backend's `afterID`
 * field, which would match our `beforeItemId` value. */
export type ReorderItemsDTO = {
    item: Item;
    beforeItemId?: string;
    afterItemId?: string;
};

export const ORDER_STEP = 100;
export const ORDER_DECIMAL_THRESHOLD = 10;

export const getOrderDecimals = (value: number) => {
    if (Math.floor(value) === value) return 0;
    return value.toString().split('.')[1].length || 0;
};

export const getOrderByIndex = (index: number) => ORDER_STEP * (index + 1);

export const getNextOrder = async (db: AuthenticatorDB) => {
    const lastItem = await db.items.orderBy('order').last();
    return lastItem ? lastItem.order + ORDER_STEP : ORDER_STEP;
};

export const itemSort = (a: Item, b: Item) => a.order - b.order;

/** Two-tier item sorting: synced items first by remote order
 * if provided, then unsynced items by local order. */
export const itemSyncSortWithOrdering =
    <T extends { order: number }>(ordering?: Partial<Record<string, T>>) =>
    (a: Item, b: Item) => {
        const { syncMetadata: syncA } = a;
        const { syncMetadata: syncB } = b;
        const syncedA = syncA && syncA.state === 'Synced';
        const syncedB = syncB && syncB.state === 'Synced';

        /** Synced items always come first */
        if (syncedA !== syncedB) return syncedA ? -1 : 1;

        /** Within synced tier: use remote ordering if available */
        if (ordering && syncedA && syncedB) {
            const orderA = ordering[syncA.entryId]?.order;
            const orderB = ordering[syncB.entryId]?.order;
            if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
        }

        /** Fallback to local order */
        return itemSort(a, b);
    };

/** Standard two-tier sorting: synced items first,
 * then unsynced items, both by local order */
export const itemSyncSort = itemSyncSortWithOrdering();

import { authService } from 'proton-authenticator/lib/auth/service';
import { db } from 'proton-authenticator/lib/db/db';
import type { Item } from 'proton-authenticator/lib/db/entities/items';
import type { EditEntryDTO, EntryDTO } from 'proton-authenticator/lib/entries/items';
import { fromWasmEntry, getEntryFromValues, getNowRustTimestamp } from 'proton-authenticator/lib/entries/items';
import type { ReorderItemsDTO } from 'proton-authenticator/lib/entries/ordering';
import {
    ORDER_DECIMAL_THRESHOLD,
    ORDER_STEP,
    getNextOrder,
    getOrderByIndex,
    getOrderDecimals,
    itemSyncSort,
} from 'proton-authenticator/lib/entries/ordering';
import {
    addRemoteEntries,
    deleteRemoteEntries,
    reorderRemoteEntry,
    updateRemoteEntries,
} from 'proton-authenticator/lib/entries/sync';
import logger from 'proton-authenticator/lib/logger';
import { withErrorDetails } from 'proton-authenticator/lib/utils/errors';
import { createAutomaticBackup } from 'proton-authenticator/store/backup';
import { c } from 'ttag';

import noop from '@proton/utils/noop';

import { createAppAsyncThunk } from './utils';

export const editEntry = createAppAsyncThunk(
    'entries/edit',
    async (values: EditEntryDTO, { dispatch, extra: { createNotification } }) => {
        try {
            const dbItem = await db.items.get(values.id);
            const updatedItem: Omit<Item, 'order'> = {
                ...dbItem,
                ...fromWasmEntry(getEntryFromValues(values)),
                id: values.id,
                syncMetadata: !dbItem?.syncMetadata
                    ? undefined
                    : {
                          ...dbItem.syncMetadata,
                          modifyTime: getNowRustTimestamp(),
                          state: 'PendingSync',
                      },
            };
            const isUpdated = await db.items.update(values.id, updatedItem);
            if (!isUpdated) throw new Error('[Entries::edit] Failed to update database');

            const success = { text: c('authenticator-2025:Info').t`Code edited` };
            const api = authService.getApi();

            if (!api) createNotification(success);
            if (api && updatedItem.syncMetadata) {
                await updateRemoteEntries([updatedItem])
                    .then(() => createNotification(success))
                    .catch((err) => {
                        const text = c('authenticator-2025:Info').t`Code edited but could not be synced`;
                        createNotification({ text: withErrorDetails(text)(err) });
                    });
            }
            void dispatch(createAutomaticBackup());
        } catch (err) {
            logger.error(`[Entries::edit] Failed to edit entry ${err}`);
            createNotification({ text: c('authenticator-2025:Info').t`Failed to edit code`, type: 'error' });
        }
    }
);

export const addEntry = createAppAsyncThunk(
    'entries/add',
    async (values: EntryDTO, { dispatch, extra: { createNotification } }) => {
        try {
            const entry = getEntryFromValues(values);
            const item = fromWasmEntry(entry);
            await db.items.add({ ...item, order: await getNextOrder(db) });

            const success = { text: c('authenticator-2025:Info').t`Code added` };

            const api = authService.getApi();
            if (!api) createNotification(success);
            else {
                await addRemoteEntries([item])
                    .then(() => createNotification(success))
                    .catch((err) => {
                        const text = c('authenticator-2025:Info').t`Code added but could not be synced`;
                        createNotification({ text: withErrorDetails(text)(err) });
                    });
            }

            void dispatch(createAutomaticBackup());
        } catch (err) {
            const text = c('authenticator-2025:Info').t`Failed to add code.`;
            logger.error(`[Entries::add] Failed to add entry. (${err})`);
            createNotification({ text, type: 'error' });
        }
    }
);

export const removeEntry = createAppAsyncThunk(
    'entries/remove',
    async (item: Item, { dispatch, extra: { createNotification } }) => {
        if (item.syncMetadata) {
            await db.items.update(item.id, {
                syncMetadata: {
                    ...item.syncMetadata,
                    modifyTime: getNowRustTimestamp(),
                    state: 'PendingToDelete',
                },
            });
        } else await db.items.delete(item.id);

        void dispatch(createAutomaticBackup());

        if (authService.getApi() && item.syncMetadata) {
            deleteRemoteEntries([item.syncMetadata.entryId])
                .then((deletions) => {
                    if (deletions.length > 0) void db.items.delete(item.id);
                })
                .catch(noop);
        }

        createNotification({ text: c('authenticator-2025:Info').t`Code deleted` });
    }
);

/** NOTE: The API expects `afterItemId` to represent the item that should come
 * immediately before the reordered item in the final ordering. Our DTO uses
 * `beforeItemId` and `afterItemId` to represent the bounds around the target
 * position, so we map our DTO's `beforeItemId` to the API's `afterItemId`. */
export const reorderEntry = createAppAsyncThunk(
    'entries/reorder',
    async ({ item, afterItemId, beforeItemId }: ReorderItemsDTO, { extra: { createNotification } }) => {
        try {
            const afterItem = (await (afterItemId ? db.items.get(afterItemId) : db.items.orderBy('order').last()))!;
            const beforeItem = (await (beforeItemId ? db.items.get(beforeItemId) : db.items.orderBy('order').first()))!;

            /** Compute a unique order to avoid having to update
             * the order of every item for performance reasons */
            const order = (() => {
                /* Item was moved between 2 items */
                if (afterItemId && beforeItemId) return (beforeItem.order + afterItem.order) / 2;
                /* Item was moved to the last position */
                if (beforeItemId) return beforeItem.order + ORDER_STEP;
                /* Item was moved to the first position */
                if (afterItemId) return afterItem.order - ORDER_STEP;
                /* should not happen (drag & drop is disabled if user only has only 1 item) */
                throw new Error('[Entries::reorder] invalid reordering operation');
            })();

            const isUpdated = await db.items.update(item.id, { order });
            if (!isUpdated) throw new Error('[Entries::reorder] Failed to update database');

            /* If order has too many digits after the decimal point,
             * update all items order to be integer. */
            if (getOrderDecimals(order) > ORDER_DECIMAL_THRESHOLD) {
                const sortedItems = (await db.items.toSafeArray()).sort(itemSyncSort);
                await db.items.bulkUpdate(
                    sortedItems.map((item, idx) => ({
                        key: item.id,
                        changes: { order: getOrderByIndex(idx) },
                    }))
                );
            }

            if (authService.getApi() && item.syncMetadata) {
                const apiAfterID = beforeItemId ? beforeItem?.syncMetadata?.entryId : undefined;
                await reorderRemoteEntry(item.syncMetadata.entryId, apiAfterID).catch((err) => {
                    const text = c('authenticator-2025:Info').t`Code reordered but could not be synced`;
                    createNotification({ text: withErrorDetails(text)(err) });
                });
            }
        } catch (err) {
            logger.error(`[Entries::reorder] Failed to reorder entries ${err}`);
            createNotification({ text: c('authenticator-2025:Error').t`Failed to reorder items`, type: 'error' });
        }
    }
);

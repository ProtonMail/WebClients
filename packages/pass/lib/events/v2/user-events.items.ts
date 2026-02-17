import groupBy from 'lodash/groupBy';
import { call, put } from 'redux-saga/effects';

import { MIN_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import type { EventProcessor } from '@proton/pass/lib/events/types';
import { requestItem } from '@proton/pass/lib/items/item.requests';
import { itemsDeleteEvent, itemsUpdated } from '@proton/pass/store/actions';
import { discardDrafts } from '@proton/pass/store/sagas/items/item-drafts';
import type { ItemRevision, SyncEventShareItemOutput } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import chunk from '@proton/utils/chunk';

/** Async generator yielding batches of fetched items. Batches are processed
 * in parallel, sequenced across batches. Errors are swallowed - failed items
 * are simply omitted. Returns `true` if all items were fetched successfully */
async function* batchedItemFetcher(updated: SyncEventShareItemOutput[]): AsyncGenerator<ItemRevision[], boolean> {
    const batches = chunk(updated, MIN_MAX_BATCH_PER_REQUEST);
    let processed = true;

    for (const batch of batches) {
        const results = await Promise.allSettled(batch.map(({ ShareID, ItemID }) => requestItem(ShareID, ItemID)));

        const items = results
            .filter((res): res is PromiseFulfilledResult<ItemRevision> => res.status === 'fulfilled')
            .map(prop('value'));

        if (items.length < batch.length) processed = false;
        yield items;
    }

    return processed;
}

/** Processes item updates in batches, dispatching `itemsUpdated`
 * per batch. Returns `true` if all items were fetched successfully. */
export function* processItemsUpdated(updated: SyncEventShareItemOutput[]): EventProcessor {
    if (updated.length === 0) return true;

    const fetcher = batchedItemFetcher(updated);

    while (true) {
        const { value, done }: IteratorResult<ItemRevision[], boolean> = yield call(() => fetcher.next());
        if (done) return value;
        if (value.length > 0) yield put(itemsUpdated(value));
    }
}

/** Processes item deletions by discarding drafts and dispatching delete
 * events. Items are grouped by `ShareID` due to legacy constraints.
 *
 * FIXME: Refactor `discardDrafts` and `itemsDeleteEvent` to accept a flat
 * list of `UniqueItem` pairs instead of requiring shareID grouping. This
 * would simplify event processing and align with the V2 event structure. */
export function* processItemsDeleted(deleted: SyncEventShareItemOutput[]): EventProcessor {
    if (deleted.length === 0) return true;

    const byShareID = groupBy(deleted, prop('ShareID'));

    for (const shareId in byShareID) {
        const deletedItemIDs = Object.values(byShareID[shareId]).map(prop('ItemID'));
        yield discardDrafts(shareId, deletedItemIDs);
        yield put(itemsDeleteEvent(shareId, deletedItemIDs));
    }

    return true;
}

import groupBy from 'lodash/groupBy';
import { call, put } from 'redux-saga/effects';

import { MIN_MAX_BATCH_PER_REQUEST } from '@proton/pass/constants';
import { requestItem } from '@proton/pass/lib/items/item.requests';
import { discardDrafts } from '@proton/pass/lib/sync/common/drafts';
import type { EventProcessor } from '@proton/pass/lib/sync/types';
import { itemsDeleteEvent, itemsUpdated } from '@proton/pass/store/actions';
import type { ItemRevision, SyncEventShareItemOutput } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import chunk from '@proton/utils/chunk';

/** Processes item updates in batches, dispatching `itemsUpdated`
 * per batch. Errors are swallowed - failed items are simply omitted.
 * Returns `true` if all items were fetched successfully. */
export function* processItemsUpdated(updated: SyncEventShareItemOutput[]): EventProcessor {
    if (updated.length === 0) return true;
    let processed = true;

    for (const batch of chunk(updated, MIN_MAX_BATCH_PER_REQUEST)) {
        const results: PromiseSettledResult<ItemRevision>[] = yield call(() =>
            Promise.allSettled(batch.map(({ ShareID, ItemID }) => requestItem(ShareID, ItemID)))
        );

        const items = results
            .filter((res): res is PromiseFulfilledResult<ItemRevision> => res.status === 'fulfilled')
            .map(prop('value'));

        if (items.length < batch.length) processed = false;
        if (items.length > 0) yield put(itemsUpdated(items));
    }

    return processed;
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

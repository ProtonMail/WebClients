import groupBy from 'lodash/groupBy';
import { call, put } from 'redux-saga/effects';

import chunk from '@proton/utils/chunk';

import { MIN_MAX_BATCH_PER_REQUEST } from '../../../constants';
import { itemsDeleteEvent, itemsUpdated } from '../../../store/actions';
import type { ItemRevision, Maybe, SyncEventShareItemOutput } from '../../../types';
import { prop } from '../../../utils/fp/lens';
import { truthy } from '../../../utils/fp/predicates';
import { requestItem } from '../../items/item.requests';
import { discardDrafts } from '../common/drafts';
import type { EventProcessor } from '../types';

/** Processes item updates in batches, dispatching `itemsUpdated` per batch.
 * Items that fail to decrypt, or that belong to a removed share, resolve to
 * `undefined` and are omitted from the dispatch without blocking the parent
 * event cursor. Any other failed fetch flips the result to `false` so the
 * batch is retried on next poll. */
export function* processItemsUpdated(updated: SyncEventShareItemOutput[]): EventProcessor {
    if (updated.length === 0) return true;
    let processed = true;

    for (const batch of chunk(updated, MIN_MAX_BATCH_PER_REQUEST)) {
        const results: PromiseSettledResult<Maybe<ItemRevision>>[] = yield call(() =>
            Promise.allSettled(batch.map(({ ShareID, ItemID }) => requestItem(ShareID, ItemID)))
        );

        const fulfilled = results
            .filter((res): res is PromiseFulfilledResult<Maybe<ItemRevision>> => res.status === 'fulfilled')
            .map(prop('value'));

        const items = fulfilled.filter(truthy);

        if (fulfilled.length < batch.length) processed = false;
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

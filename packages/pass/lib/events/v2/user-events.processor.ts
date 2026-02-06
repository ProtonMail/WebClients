import { all, call } from 'redux-saga/effects';

import { processAliasNoteChanged, processPendingAliasToCreate } from '@proton/pass/lib/events/v2/user-events.alias';
import { PendingFileLinkTracker } from '@proton/pass/lib/file-attachments/file-link.tracker';
import { getItemKey } from '@proton/pass/lib/items/item.utils';
import type { SyncEventListOutput } from '@proton/pass/types';

import { processItemsDeleted, processItemsUpdated } from './user-events.items';

export type ProcessResult = { status: 'processed'; ok: boolean } | { status: 'skipped'; reason: string };

/** Predicates that determine if event processing should proceed */
const shouldSkipEvent = (events: SyncEventListOutput): boolean => {
    /** Edge-case: We might receive an update event from the BE before a file
     * linking operation has completed. To avoid inconsistencies between
     * optimistic updates and server events, skip processing the entire event
     * batch if any item has a pending file link operation. */
    const hasPendingFileLinks = events.ItemsUpdated.some(({ ShareID, ItemID }) => {
        const itemKey = getItemKey({ shareId: ShareID, itemId: ItemID });
        return PendingFileLinkTracker.isPending(itemKey);
    });

    if (hasPendingFileLinks) return true;
    return false;
};

/** Processes user events v2. Runs all event processors in parallel.
 * Returns `true` if all processors succeeded, `false` otherwise.
 * When returning `false`, the caller should NOT update the eventID
 * so that the same events are retried on the next poll. */
export function* processUserEvents(event: SyncEventListOutput) {
    if (shouldSkipEvent(event)) return false;

    /** Trigger full sync and update `LastEventID` */
    if (event.FullRefresh) return true;

    /** Run all processors in parallel - each returns boolean indicating success */
    const results: boolean[] = yield all([
        call(processItemsUpdated, event.ItemsUpdated),
        call(processItemsDeleted, event.ItemsDeleted),
        call(processAliasNoteChanged, event.AliasNoteChanged),
        call(processPendingAliasToCreate, event.PendingAliasToCreateChanged),
    ]);

    return results.every(Boolean);
}

import { all, call } from 'redux-saga/effects';

import type { RootSagaOptions } from '../../../store/types';
import type { SyncEventListOutput } from '../../../types';
import { PendingFileLinkTracker } from '../../file-attachments/file-link.tracker';
import { getItemKey } from '../../items/item.utils';
import type { EventProcessor } from '../types';
import { processAliasNoteChanged, processPendingAliasToCreate } from './user-events.alias';
import { processFoldersDeleted, processFoldersUpdated } from './user-events.folders';
import {
    processGroupInvitesChanged,
    processInvitesChanged,
    processSharesWithInvitesToCreate,
} from './user-events.invites';
import { processItemsDeleted, processItemsUpdated } from './user-events.items';
import { processSharesCreated, processSharesDeleted, processSharesUpdated } from './user-events.shares';
import { processFullRefresh } from './user-events.sync';
import { processBreachUpdate, processOrganizationInfoChanged, processUserRefresh } from './user-events.user';

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
export function* processUserEvents(event: SyncEventListOutput, options: RootSagaOptions): EventProcessor {
    if (shouldSkipEvent(event)) return false;

    /** Trigger full sync and update `LastEventID` */
    if (event.FullRefresh) {
        const synced: boolean = yield call(processFullRefresh, options);
        return synced;
    }

    /** Run all processors in parallel - each returns boolean indicating success */
    const results: boolean[] = yield all([
        call(processItemsUpdated, event.ItemsUpdated),
        call(processItemsDeleted, event.ItemsDeleted),
        call(processAliasNoteChanged, event.AliasNoteChanged),
        call(processPendingAliasToCreate, event.PendingAliasToCreateChanged),
        call(processBreachUpdate, event.BreachUpdate),
        call(processSharesCreated, event.SharesCreated, options),
        call(processSharesUpdated, event.SharesUpdated),
        call(processSharesDeleted, event.SharesDeleted),
        call(processFoldersUpdated, event.FoldersUpdated),
        call(processFoldersDeleted, event.FoldersDeleted),
        call(processUserRefresh, event.RefreshUser),
        call(processOrganizationInfoChanged, event.OrganizationInfoChanged, options),
        call(processInvitesChanged, event.InvitesChanged),
        call(processGroupInvitesChanged, event.GroupInvitesChanged),
        call(processSharesWithInvitesToCreate, event.SharesWithInvitesToCreate),
    ]);

    return results.every(Boolean);
}

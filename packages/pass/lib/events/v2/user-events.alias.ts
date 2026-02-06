import { call, put } from 'redux-saga/effects';

import type { EventProcessor } from '@proton/pass/lib/events/v2/user-events.types';
import { aliasPendingCreated, itemsUpdated } from '@proton/pass/store/actions';
import { syncPendingAliases } from '@proton/pass/store/sagas/alias/alias-sync.sagas';
import type {
    ItemRevision,
    MaybeNull,
    SyncEventChangedWithTokenOutput,
    SyncEventShareItemOutput,
} from '@proton/pass/types';

/** Alias notes are retrieved at the UI layer level for now, no need
 * to process this event for now. If we ever decide to cache the `slNote`
 * property on the item, we should query the alias details here. */
export function* processAliasNoteChanged(_: SyncEventShareItemOutput[]): EventProcessor {
    return true;
}

export function* processPendingAliasToCreate(event?: MaybeNull<SyncEventChangedWithTokenOutput>): EventProcessor {
    try {
        if (!event) return true;

        const items: ItemRevision[] = yield call(syncPendingAliases);
        yield put(itemsUpdated(items));
        yield put(aliasPendingCreated(items));

        return true;
    } catch {
        return false;
    }
}

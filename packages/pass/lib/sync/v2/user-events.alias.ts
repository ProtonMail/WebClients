import { call, put } from 'redux-saga/effects';

import { aliasPendingCreated, itemsUpdated } from '../../../store/actions';
import type {
    ItemRevision,
    MaybeNull,
    SyncEventChangedWithTokenOutput,
    SyncEventShareItemOutput,
} from '../../../types';
import { NoDefaultVaultError } from '../../../utils/errors/errors';
import { syncPendingAliases } from '../common/alias';
import type { EventProcessor } from '../types';

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
    } catch (err) {
        /** Avoid blocking the parent event cursor if syncing
         * pending aliases cannot succeed on vault-less account */
        if (err instanceof NoDefaultVaultError) return true;
        return false;
    }
}

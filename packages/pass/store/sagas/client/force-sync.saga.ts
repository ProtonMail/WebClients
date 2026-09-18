import { call, delay, put, race, select, take, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { HOUR, MINUTE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { hasFoldersApi } from '../../../lib/folders/folders.requests';
import type { ForceSyncEntry, ForceSyncStore } from '../../../lib/sync/force-sync';
import type { Share } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { logger } from '../../../utils/logger';
import { bootSuccess, stateDestroy, syncFailure, syncIntent, syncSuccess } from '../../actions';
import { syncRequest } from '../../actions/requests';
import { selectRequestInFlight } from '../../request/selectors';
import { selectAllVaults, selectFeatureFlag } from '../../selectors';
import type { RootSagaOptions } from '../../types';

/** Give up force sync after MAX_ATTEMPTS,
 * the user can still manually sync from the menu. */
const MAX_ATTEMPTS = 10;
const MIN_RETRY_INTERVAL = 30 * MINUTE;
const CHECK_INTERVAL = HOUR;
const SYNC_TIMEOUT = 5 * MINUTE;

/** One unreadable share must not hide folders in other vaults. */
function* anyVaultHasFolders(): Generator<unknown, { hasFolders: boolean; failed: boolean }> {
    const vaults: Share[] = yield select(selectAllVaults);
    let failed = false;

    for (const { shareId } of vaults) {
        try {
            const hasFolder: boolean = yield call(hasFoldersApi, shareId);
            if (hasFolder) return { hasFolders: true, failed: false };
        } catch (err) {
            failed = true;
            logger.warn('[ForceSync] Folder probe failed for a share', err);
        }
    }

    return { hasFolders: false, failed };
}

export function* checkForForceSync(store: ForceSyncStore): Generator {
    const entry: ForceSyncEntry = yield call(store.read);
    if (entry.done || entry.attempts >= MAX_ATTEMPTS) return;
    if (Date.now() - entry.lastAttemptAt < MIN_RETRY_INTERVAL) return;

    const enabled: boolean = yield select(selectFeatureFlag(PassFeature.PassForceSyncFolders));
    if (!enabled) return;

    /** The sync watcher only listens for syncIntent when idle (see sync.saga.ts),
     * so dispatching it now would be lost and we would wait forever for a result. */
    if (yield select(selectRequestInFlight(syncRequest()))) return;

    const attempts = entry.attempts + 1;
    yield call(store.write, { ...entry, attempts, lastAttemptAt: Date.now() });

    try {
        const { hasFolders, failed } = yield call(anyVaultHasFolders);

        if (hasFolders) {
            logger.info('[ForceSync] Folders detected, forcing a full sync');
            yield put(
                syncIntent({
                    message: c('Info').t`Full data sync to improve app performance. Thank you for your patience.`,
                })
            );

            const { ok } = yield race({
                ok: take(syncSuccess.match),
                failed: take(syncFailure.match),
                destroyed: take(stateDestroy.match),
                timeout: delay(SYNC_TIMEOUT),
            });

            if (!ok) return logger.warn('[ForceSync] Sync did not complete, will retry');
        } else if (failed) return;

        yield call(store.write, { done: true, attempts, lastAttemptAt: Date.now() });
    } catch (err) {
        logger.warn('[ForceSync] Check failed, will retry', err);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(bootSuccess.match, function* (action) {
        const store = options.getForceSyncStore?.();
        if (!store) return;

        /** A payload here means boot already did a full download (fresh
         * install or empty cache), so no force sync is needed. */
        if (action.payload) {
            const entry: ForceSyncEntry = yield call(store.read);
            if (!entry.done) yield call(store.write, { ...entry, done: true });
            return;
        }

        yield race({
            /** Checks hourly for sessions that never restart. On the extension
             * the service worker is shut down when idle and restarted on demand,
             * so boot alone already covers most checks there. */
            check: call(function* () {
                yield call(checkForForceSync, store);

                while (!EXTENSION_BUILD) {
                    yield wait(CHECK_INTERVAL);
                    yield call(checkForForceSync, store);
                }
            }),
            destroyed: take(stateDestroy.match),
        });
    });
}

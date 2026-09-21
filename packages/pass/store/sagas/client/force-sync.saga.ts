import { call, delay, put, race, select, take, takeLatest } from 'redux-saga/effects';
import { c } from 'ttag';

import { HOUR, MINUTE } from '@proton/shared/lib/constants';

import { hasFoldersApi } from '../../../lib/folders/folders.requests';
import type { ForceSyncEntry, ForceSyncStore } from '../../../lib/sync/force-sync';
import type { Share } from '../../../types';
import { PassFeature } from '../../../types/api/features';
import { logger } from '../../../utils/logger';
import { bootSuccess, getUserFeaturesSuccess, stateDestroy, syncFailure, syncIntent, syncSuccess } from '../../actions';
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

/** Returns `true` once there is no force sync needed for this account. */
export function* checkForForceSync(store: ForceSyncStore): Generator<unknown, boolean> {
    const entry: ForceSyncEntry = yield call(store.read);
    if (entry.done || entry.attempts >= MAX_ATTEMPTS) return true;
    if (Date.now() - entry.lastAttemptAt < MIN_RETRY_INTERVAL) return false;

    const enabled: boolean = yield select(selectFeatureFlag(PassFeature.PassForceSyncFolders));
    if (!enabled) return false;

    /** The sync watcher only listens for syncIntent when idle (see sync.saga.ts),
     * so dispatching it now would be lost and we would wait forever for a result. */
    if (yield select(selectRequestInFlight(syncRequest()))) return false;

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

            if (!ok) {
                logger.warn('[ForceSync] Sync did not complete, will retry');
                return false;
            }
        } else if (failed) return false;

        yield call(store.write, { done: true, attempts, lastAttemptAt: Date.now() });
        return true;
    } catch (err) {
        logger.warn('[ForceSync] Check failed, will retry', err);
        return false;
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLatest(bootSuccess.match, function* (action) {
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
            check: call(function* () {
                while (true) {
                    const done: boolean = yield call(checkForForceSync, store);
                    if (done) return;

                    yield race({
                        /** bootSuccess fires before the feature flags are refreshed,
                         * so the first check may read a stale value. */
                        features: take(getUserFeaturesSuccess.match),
                        /** Checks hourly for sessions that never restart. */
                        tick: delay(CHECK_INTERVAL),
                    });
                }
            }),
            destroyed: take(stateDestroy.match),
        });
    });
}

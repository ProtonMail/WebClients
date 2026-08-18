import type { Action } from 'redux';
import { call, put, race, select, take, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { PassCryptoError, isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { migrate } from '@proton/pass/lib/sync/migrate';
import { sync } from '@proton/pass/lib/sync/sync';
import { type SyncResult, SyncStrategy } from '@proton/pass/lib/sync/types';
import {
    aliasSyncStatus,
    bootFailure,
    bootIntent,
    bootSuccess,
    cacheConflict,
    cacheRequest,
    draftsGarbageCollect,
    getBreaches,
    getInAppNotifications,
    getUserAccessIntent,
    getUserFeaturesIntent,
    getUserSettings,
    passwordHistoryGarbageCollect,
    secureLinksGet,
    startEventPolling,
    stateDestroy,
    stopEventPolling,
} from '@proton/pass/store/actions';
import { resolveModelRegistry } from '@proton/pass/store/actions/creators/model-registry';
import { getOrganizationPauseList, getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { resolvePrivateDomains } from '@proton/pass/store/actions/creators/private-domains';
import { resolveWebsiteRules } from '@proton/pass/store/actions/creators/rules';
import { getAuthDevices } from '@proton/pass/store/actions/creators/sso';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { selectFeatureFlag, selectProxiedSettings, selectSyncStrategy } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';
import { AppStatus } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

import { type HydrationResult, hydrate } from './hydrate.saga';

function* bootWorker({ payload }: ReturnType<typeof bootIntent>, options: RootSagaOptions) {
    const { offline = false, reauth } = payload ?? {};

    try {
        const settings: ProxiedSettings = yield options.getSettings();
        if (offline && !settings.offlineEnabled) throw new Error('Unauthorized offline boot');

        const online = !offline;
        const authStore = options.getAuthStore();
        const userID = authStore.getUserID()!;

        options.setAppStatus(AppStatus.BOOTING);
        yield put(stopEventPolling());
        yield loadCryptoWorker();

        /* merge the existing cache to preserve any state that may have been
         * mutated before the boot sequence (session lock data). Hydration will
         * set the sync-strategy under the hood based on the current user state. */
        const { fromCache, version, state }: HydrationResult = yield hydrate(
            { online, merge: (existing, incoming) => merge(existing, incoming, { excludeEmpty: true }) },
            options
        );

        /** PassCrypto must be successfully hydrated during online boot. This validates
         * that crypto operations can be performed with the current session state. */
        if (online && !PassCrypto.ready) throw new PassCryptoError();

        /** By this time: hydration of an existing cache will have hydrated the sync strategy. */
        let syncResult: Maybe<SyncResult> = fromCache ? undefined : yield call(sync, state, options);

        if (fromCache && state && online) {
            /** If the feature flag has changed since this cache was created,
             * migrate the sync strategy before polling starts. On failure,
             * the old strategy remains and migration retries on next boot.
             * A V2→V1 rollback returns its V1 sync result to apply via `bootSuccess`. */
            const syncV2 = selectFeatureFlag(PassFeature.PassUserEventsV1)(state);
            const currStrategy = selectSyncStrategy(state);
            const nextStrategy = SyncStrategy[syncV2 ? 'USER_EVENTS' : 'LEGACY'];
            if (currStrategy !== nextStrategy) syncResult = yield call(migrate, nextStrategy, options);
        }

        /** Sync settings after successful hydration and synchronization.
         * This prevents offline mode from being enabled if the boot
         * sequence fails (eg: during first login) */
        const hydratedSettings = (yield select(selectProxiedSettings)) as ProxiedSettings;
        yield options.onSettingsUpdated?.(hydratedSettings);

        yield put(bootSuccess(syncResult));
        yield put(draftsGarbageCollect());
        yield put(passwordHistoryGarbageCollect());

        if (online) {
            const syncStrategy: SyncStrategy = yield select(selectSyncStrategy);
            const legacySync = syncStrategy === SyncStrategy.LEGACY;

            /** NOTE: critical we start polling after the `bootSuccess` is dispatched in case
             * of a first V2 sync: this ensures the `userEventID` is hydrated in state. */
            yield put(startEventPolling());

            if (legacySync) {
                /** In V2 mode these are covered by user events:
                 *  - breaches: `BreachUpdate`
                 *  - alias sync: `UserRefreshed` */
                yield put(withRevalidate(getBreaches.intent()));
                yield put(withRevalidate(aliasSyncStatus.intent()));
            }

            yield put(withRevalidate(secureLinksGet.intent()));
            yield put(withRevalidate(getInAppNotifications.intent()));
            yield put(getAuthDevices.intent());

            if (EXTENSION_BUILD) {
                yield put(resolveWebsiteRules.intent());
                yield put(resolvePrivateDomains.intent());
                yield put(resolveModelRegistry.intent());
                yield put(withRevalidate(getOrganizationPauseList.intent()));
            }

            if (fromCache) {
                /** These actions should only be revalidated when booting
                 * from cache. When logging-in for the first time or if
                 * cache is corrupted, these will have been revalidated
                 * by the `hydrate` call above inside `getUserData` */
                yield put(withRevalidate(getUserFeaturesIntent(userID)));
                yield put(withRevalidate(getUserSettings.intent(userID)));
                if (EXTENSION_BUILD) yield put(withRevalidate(getOrganizationPauseList.intent()));

                if (legacySync) {
                    /** In V2 mode these are covered by user events:
                     *  - user access: `UserRefreshed`
                     *  - org settings: `OrganizationInfoChanged` */
                    yield put(withRevalidate(getUserAccessIntent(userID)));
                    yield put(withRevalidate(getOrganizationSettings.intent()));
                }
            }
        }

        options.setAppStatus(online ? AppStatus.READY : AppStatus.OFFLINE);
        options.onBoot?.({ ok: true, fromCache, version, offline, reauth });
        yield call(options.onItemsUpdated, { report: true });
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));
        options.setAppStatus(AppStatus.ERROR);
        options.onBoot?.({ ok: false, clearCache: isPassCryptoError(error), offline });
    }
}

/** Cancel the booting task if we detect a state destruction or another tab
 * persisting a newer cache that staled this tab's hydration. The `bootWorker`
 * may have already dispatched `bootSuccess` before being cancelled, so we must
 * set the app status to `ERROR` to avoid stucking the app in a `BOOTING` state. */
export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(bootIntent.match, function* (action) {
        /** Gate the API to session-resume routes for the duration of an
         * offline boot. Derived from the boot payload so a subsequent online
         * boot in the same lifecycle clears the gate. */
        api.setResumeLock(Boolean(action.payload?.offline));

        const { conflict, destroyed } = (yield race({
            booted: call(bootWorker, action, options),
            conflict: take(cacheConflict.match),
            destroyed: take(stateDestroy.match),
        })) as { conflict?: Action; destroyed?: Action };

        if (conflict || destroyed) {
            logger.warn(`[Saga::Boot] boot cancelled [conflict=${Boolean(conflict)}, destroyed=${Boolean(destroyed)}]`);
            yield put(bootFailure(new Error(c('Action').t`Please retry`)));
            options.setAppStatus(AppStatus.ERROR);
            options.onBoot?.({ ok: false, clearCache: false, offline: action.payload?.offline ?? false });
        } else yield put(cacheRequest({ throttle: true }));
    });

    yield takeLeading(bootFailure.match, function* () {
        api.setResumeLock(false);
    });
}

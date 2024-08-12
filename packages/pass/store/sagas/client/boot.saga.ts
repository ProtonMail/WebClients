import type { Action } from 'redux';
import { call, put, race, take, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { PassCryptoError, isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import {
    bootFailure,
    bootIntent,
    bootSuccess,
    cacheRequest,
    draftsGarbageCollect,
    getBreaches,
    getUserAccessIntent,
    getUserFeaturesIntent,
    getUserSettings,
    passwordHistoryGarbageCollect,
    secureLinksGet,
    startEventPolling,
    stateDestroy,
    stopEventPolling,
} from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import { isCachingAction } from '@proton/pass/store/actions/enhancers/cache';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import { AppStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

import { hydrate } from './hydrate.saga';

function* bootWorker({ payload }: ReturnType<typeof bootIntent>, options: RootSagaOptions) {
    try {
        const settings: ProxiedSettings = yield options.getSettings();
        if (payload?.offline && !settings.offlineEnabled) throw new Error('Unauthorized offline boot');

        const online = !payload?.offline;
        const authStore = options.getAuthStore();
        const userID = authStore.getUserID()!;

        options.setAppStatus(AppStatus.BOOTING);
        yield put(stopEventPolling());
        yield loadCryptoWorker();

        /* merge the existing cache to preserve any state that may have been
         * mutated before the boot sequence (session lock data) */
        const fromCache: boolean = yield hydrate(
            {
                allowFailure: online,
                merge: (existing: State, incoming: State) => merge(existing, incoming, { excludeEmpty: true }),
            },
            options
        );

        /* if we're booting online and `PassCrypto` has not been hydrated
         * after state hydration, abort the boot sequence early */
        if (online && !PassCrypto.ready) throw new PassCryptoError();

        yield put(bootSuccess(fromCache ? undefined : yield synchronize(SyncType.FULL)));
        yield put(draftsGarbageCollect());
        yield put(passwordHistoryGarbageCollect());

        if (online) {
            yield put(withRevalidate(getOrganizationSettings.intent()));
            yield put(startEventPolling());
            yield put(withRevalidate(getBreaches.intent()));
            yield put(withRevalidate(secureLinksGet.intent()));

            if (fromCache) {
                yield put(withRevalidate(getUserFeaturesIntent(userID)));
                yield put(withRevalidate(getUserAccessIntent(userID)));
                yield put(withRevalidate(getUserSettings.intent(userID)));
            }
        }

        options.setAppStatus(online ? AppStatus.READY : AppStatus.OFFLINE);
        options.onBoot?.({ ok: true, fromCache, offline: payload?.offline });
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));
        options.setAppStatus(AppStatus.ERROR);
        options.onBoot?.({ ok: false, clearCache: isPassCryptoError(error) });
    }
}

/** If during the boot sequence we detect a state destruction
 * or a caching request : cancel the booting task. This can happen
 * when stressing the app on multiple tabs */
export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(bootIntent.match, function* (action) {
        const { caching, destroyed } = (yield race({
            booted: call(bootWorker, action, options),
            caching: take(isCachingAction),
            destroyed: take(stateDestroy.match),
        })) as { caching?: Action; destroyed?: Action };

        if (caching || destroyed) {
            logger.warn(`[Saga::Boot] boot cancelled [caching=${Boolean(caching)}, destroyed=${Boolean(destroyed)}]`);
            yield put(bootFailure(new Error(c('Action').t`Sign back in`)));
            options.onBoot?.({ ok: false, clearCache: false });
        } else yield put(cacheRequest({ throttle: true }));
    });
}

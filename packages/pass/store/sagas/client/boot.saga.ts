import type { Action } from 'redux';
import { put, race, take, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { isPassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import {
    bootFailure,
    bootIntent,
    bootSuccess,
    cacheRequest,
    stateDestroy,
    stopEventPolling,
} from '@proton/pass/store/actions';
import { isCachingAction } from '@proton/pass/store/actions/enhancers/cache';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import type { RootSagaOptions, State } from '@proton/pass/store/types';
import { AppStatus } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { merge } from '@proton/pass/utils/object/merge';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';

import { hydrate } from './hydrate.saga';

function* bootWorker(options: RootSagaOptions, { payload: { loginPassword } }: ReturnType<typeof bootIntent>) {
    try {
        options.setAppStatus(AppStatus.BOOTING);
        yield put(stopEventPolling());
        yield loadCryptoWorker();

        const fromCache: boolean = yield hydrate(
            {
                allowFailure: loginPassword === undefined,
                loginPassword,
                /* merge the existing cache to preserve any state that may have been
                 * mutated before the boot sequence (session lock data) */
                merge: (existing: State, incoming: State) => merge(existing, incoming, { excludeEmpty: true }),
                onError: function* () {
                    if (loginPassword) throw new Error(c('Error').t`Wrong password`);
                },
            },
            options
        );

        yield put(bootSuccess(fromCache ? undefined : yield synchronize(SyncType.FULL)));

        options.setAppStatus(loginPassword ? AppStatus.OFFLINE_UNLOCKED : AppStatus.READY);
        options.onBoot?.({ ok: true, fromCache });
    } catch (error: unknown) {
        logger.warn('[Saga::Boot]', error);
        yield put(bootFailure(error));
        options.setAppStatus(loginPassword ? AppStatus.OFFLINE_LOCKED : AppStatus.ERROR);
        options.onBoot?.({ ok: false, clearCache: isPassCryptoError(error) });
    }
}

/** If during the boot sequence we detect a state destruction
 * or a caching request : cancel the booting task. This can happen
 * when stressing the app on multiple tabs */
export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(bootIntent.match, function* (action) {
        const { caching, destroyed } = (yield race({
            start: bootWorker(options, action),
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

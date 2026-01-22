import type { Action } from 'redux';
import { call, put, race, take, takeLeading } from 'redux-saga/effects';

import { type Lock, LockMode } from '@proton/pass/lib/auth/lock/types';
import { lockCreateFailure, lockCreateIntent, lockCreateSuccess, stateDestroy } from '@proton/pass/store/actions';
import { type WithSenderAction, isActionWithSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* lockCreateWorker(
    { getAuthService, getAuthStore }: RootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof lockCreateIntent>>
) {
    const { id: requestId } = meta.request;
    const { mode, ttl, current } = payload.lock;
    const endpoint = meta.sender?.endpoint;

    try {
        const auth = getAuthService();
        const authStore = getAuthStore();

        /** check the currently registered lock in case it was mutated by another client.
         * This can happen if the web-app and extension are logged in to the same session. */
        yield auth.checkLock();

        const lock: Lock = yield call(function* (): Generator<any, Lock> {
            switch (mode) {
                case LockMode.SESSION:
                case LockMode.PASSWORD:
                case LockMode.BIOMETRICS:
                    yield auth.createLock(payload.lock);
                    return { mode, locked: false, ttl };
                case LockMode.NONE:
                    yield auth.deleteLock(authStore.getLockMode(), current?.secret ?? '');
                    return { mode: LockMode.NONE, locked: false };
            }
        });

        yield put(lockCreateSuccess(requestId, lock, endpoint));
    } catch (error) {
        yield put(lockCreateFailure(requestId, mode, error, endpoint));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(lockCreateIntent.match, function* (action) {
        /** If the user logs out or locks their session while lock creation is in-flight,
         * the success action (which triggers a settings write) could be dispatched after
         * the state reset. This would merge the initial settings with ongoing ones,
         * effectively resetting the user state in local storage. */
        const { destroyed } = yield race({
            completed: call(lockCreateWorker, options, action),
            destroyed: take(stateDestroy.match),
        }) as { destroyed?: Action };

        if (destroyed) {
            const { id: requestId } = action.meta.request;
            const { mode } = action.payload.lock;
            const endpoint = isActionWithSender(action) ? action.meta.sender?.endpoint : undefined;

            yield put(lockCreateFailure(requestId, mode, new Error(), endpoint));
        }
    });
}

import { call, put, takeLeading } from 'redux-saga/effects';

import { type Lock, LockMode } from '@proton/pass/lib/auth/lock/types';
import { lockCreateFailure, lockCreateIntent, lockCreateSuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/enhancers/endpoint';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* lockCreateWorker(
    { getAuthService, getAuthStore }: RootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof lockCreateIntent>>
) {
    try {
        const auth = getAuthService();
        const authStore = getAuthStore();

        const lock: Lock = yield call(function* (): Generator<any, Lock> {
            switch (payload.lock.mode) {
                case LockMode.SESSION:
                case LockMode.PASSWORD:
                    yield auth.createLock(payload.lock);
                    return { mode: payload.lock.mode, locked: false, ttl: payload.lock.ttl };
                case LockMode.NONE:
                    yield auth.deleteLock(authStore.getLockMode(), payload.lock.current?.secret ?? '');
                    return { mode: LockMode.NONE, locked: false };
            }
        });

        yield put(lockCreateSuccess(meta.request.id, lock, meta.sender?.endpoint));
    } catch (error) {
        yield put(lockCreateFailure(meta.request.id, payload.lock.mode, error));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(lockCreateIntent.match, lockCreateWorker, options);
}

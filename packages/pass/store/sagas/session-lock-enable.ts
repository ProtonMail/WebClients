import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock, lockSession } from '@proton/pass/auth/session-lock';

import { sessionLockEnableFailure, sessionLockEnableIntent, sessionLockEnableSuccess } from '../actions';
import { selectCanLockSession } from '../selectors';
import { WorkerRootSagaOptions } from '../types';

function* enableSessionLockWorker(
    _: WorkerRootSagaOptions,
    { meta, payload }: ReturnType<typeof sessionLockEnableIntent>
) {
    try {
        /* if we're creating a new lock over an existing one -
        which can happen during a lock TTL update - delete the
        previous one */
        if ((yield select(selectCanLockSession)) as boolean) {
            yield deleteSessionLock(payload.pin);
        }

        const storageToken: string = yield lockSession(payload.pin, payload.ttl);
        yield put(sessionLockEnableSuccess({ storageToken, ttl: payload.ttl }, meta.receiver));
    } catch (e) {
        yield put(sessionLockEnableFailure(e, meta.receiver));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockEnableIntent.match, enableSessionLockWorker, options);
}

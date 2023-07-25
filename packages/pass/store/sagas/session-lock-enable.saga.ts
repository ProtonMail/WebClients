import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock, lockSession } from '@proton/pass/auth/session-lock';

import { sessionLockEnableFailure, sessionLockEnableIntent, sessionLockEnableSuccess } from '../actions';
import type { WithSenderAction } from '../actions/with-receiver';
import { selectCanLockSession } from '../selectors';
import type { WorkerRootSagaOptions } from '../types';

function* enableSessionLockWorker(
    { onSessionLockChange }: WorkerRootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof sessionLockEnableIntent>>
) {
    try {
        /* if we're creating a new lock over an existing one -
        which can happen during a lock TTL update - delete the
        previous one */
        if ((yield select(selectCanLockSession)) as boolean) {
            yield deleteSessionLock(payload.pin);
        }

        const storageToken: string = yield lockSession(payload.pin, payload.ttl);
        yield put(sessionLockEnableSuccess({ storageToken, ttl: payload.ttl }, meta.sender?.endpoint));
        onSessionLockChange?.(true);
    } catch (e) {
        yield put(sessionLockEnableFailure(e, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockEnableIntent.match, enableSessionLockWorker, options);
}

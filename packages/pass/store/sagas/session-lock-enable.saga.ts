import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock, lockSession } from '@proton/pass/auth/session.lock';

import { sessionLockEnableFailure, sessionLockEnableIntent, sessionLockEnableSuccess } from '../actions';
import type { WithSenderAction } from '../actions/with-receiver';
import { selectHasRegisteredLock } from '../selectors';
import type { WorkerRootSagaOptions } from '../types';

function* enableSessionLockWorker(
    { onSessionLockChange }: WorkerRootSagaOptions,
    { meta, payload: { pin, ttl } }: WithSenderAction<ReturnType<typeof sessionLockEnableIntent>>
) {
    try {
        /* if we're creating a new lock over an existing one -
        which can happen during a lock TTL update - delete the
        previous one */
        if ((yield select(selectHasRegisteredLock)) as boolean) {
            yield deleteSessionLock(pin);
        }

        const sessionLockToken: string = yield lockSession(pin, ttl);
        yield put(sessionLockEnableSuccess({ sessionLockToken, ttl }, meta.sender?.endpoint));
        yield onSessionLockChange?.(sessionLockToken, ttl);
    } catch (e) {
        yield put(sessionLockEnableFailure(e, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockEnableIntent.match, enableSessionLockWorker, options);
}

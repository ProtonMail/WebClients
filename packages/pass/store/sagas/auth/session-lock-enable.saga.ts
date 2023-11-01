import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock, lockSession } from '@proton/pass/lib/auth/session-lock';
import {
    sessionLockEnableFailure,
    sessionLockEnableIntent,
    sessionLockEnableSuccess,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import { selectHasRegisteredLock } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

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
        yield put(sessionLockEnableSuccess(meta.request.id, { sessionLockToken, ttl }, meta.sender?.endpoint));
        yield onSessionLockChange?.(sessionLockToken, ttl);
    } catch (error) {
        yield put(sessionLockEnableFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockEnableIntent.match, enableSessionLockWorker, options);
}

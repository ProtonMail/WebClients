import { put, select, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock } from '@proton/pass/lib/auth/session-lock';
import {
    sessionLockEnableFailure,
    sessionLockEnableIntent,
    sessionLockEnableSuccess,
} from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import { selectHasRegisteredLock } from '@proton/pass/store/selectors';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* enableSessionLockWorker(
    { getAuthService }: WorkerRootSagaOptions,
    { meta, payload: { pin, ttl } }: WithSenderAction<ReturnType<typeof sessionLockEnableIntent>>
) {
    try {
        /* if we're creating a new lock over an existing one delete the
         * previous one. This will happen during a lock TTL update. */
        if ((yield select(selectHasRegisteredLock)) as boolean) yield deleteSessionLock(pin);

        const sessionLockToken: string = yield getAuthService().createLock(pin, ttl);
        yield put(sessionLockEnableSuccess(meta.request.id, { sessionLockToken, ttl }, meta.sender?.endpoint));
    } catch (error) {
        yield put(sessionLockEnableFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockEnableIntent.match, enableSessionLockWorker, options);
}

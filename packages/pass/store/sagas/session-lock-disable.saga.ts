import { put, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock } from '@proton/pass/auth/session-lock';

import { sessionLockDisableFailure, sessionLockDisableIntent, sessionLockDisableSuccess } from '../actions';
import type { WithSenderAction } from '../actions/with-receiver';
import type { WorkerRootSagaOptions } from '../types';

function* disableSessionLockWorker(
    _: WorkerRootSagaOptions,
    { meta, payload }: WithSenderAction<ReturnType<typeof sessionLockDisableIntent>>
) {
    try {
        yield deleteSessionLock(payload.pin);
        yield put(sessionLockDisableSuccess(meta.sender?.endpoint));
    } catch (e) {
        yield put(sessionLockDisableFailure(e, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockDisableIntent.match, disableSessionLockWorker, options);
}

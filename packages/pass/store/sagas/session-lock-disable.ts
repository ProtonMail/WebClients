import { put, takeLeading } from 'redux-saga/effects';

import { deleteSessionLock } from '@proton/pass/auth/session-lock';

import { sessionLockDisableFailure, sessionLockDisableIntent, sessionLockDisableSuccess } from '../actions';
import { WorkerRootSagaOptions } from '../types';

function* disableSessionLockWorker(
    _: WorkerRootSagaOptions,
    { meta, payload }: ReturnType<typeof sessionLockDisableIntent>
) {
    try {
        yield deleteSessionLock(payload.pin);
        yield put(sessionLockDisableSuccess(meta.receiver));
    } catch (e) {
        yield put(sessionLockDisableFailure(e, meta.receiver));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionLockDisableIntent.match, disableSessionLockWorker, options);
}

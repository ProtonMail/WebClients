import { put, takeLeading } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { revoke } from '@proton/shared/lib/api/auth';

import { signout, signoutSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* signoutIntentWorker({ onSignout }: WorkerRootSagaOptions, action: ReturnType<typeof signout>) {
    if (!action.payload.soft) yield api({ ...revoke(), silent: true });
    onSignout?.();

    yield put(signoutSuccess(action.payload));
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(signout.match, signoutIntentWorker, options);
}

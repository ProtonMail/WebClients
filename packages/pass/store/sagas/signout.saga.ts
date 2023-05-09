import { put, takeLeading } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { removeSession } from '@proton/pass/auth';

import { signout, signoutSuccess } from '../actions';
import { WorkerRootSagaOptions } from '../types';

function* signoutIntentWorker({ onSignout }: WorkerRootSagaOptions, action: ReturnType<typeof signout>) {
    if (!action.payload.soft) yield removeSession(api);

    yield put(signoutSuccess(action.payload));
    onSignout?.();
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(signout.match, signoutIntentWorker, options);
}

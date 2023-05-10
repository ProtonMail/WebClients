import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/api';

import { vaultSetPrimaryFailure, vaultSetPrimaryIntent, vaultSetPrimarySuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* setPrimaryVault(_: WorkerRootSagaOptions, { payload }: ReturnType<typeof vaultSetPrimaryIntent>): Generator {
    try {
        yield api({ url: `pass/v1/vault/${payload.id}/primary`, method: 'put' });
        yield put(vaultSetPrimarySuccess(payload, 'page'));
    } catch (error) {
        yield put(vaultSetPrimaryFailure(payload, error, 'page'));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(vaultSetPrimaryIntent.match, setPrimaryVault, options);
}

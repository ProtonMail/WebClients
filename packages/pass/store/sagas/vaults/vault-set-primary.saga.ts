import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { vaultSetPrimaryFailure, vaultSetPrimaryIntent, vaultSetPrimarySuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* setPrimaryVault(
    _: WorkerRootSagaOptions,
    { payload, meta }: WithSenderAction<ReturnType<typeof vaultSetPrimaryIntent>>
): Generator {
    try {
        yield api({ url: `pass/v1/vault/${payload.id}/primary`, method: 'put' });
        yield put(vaultSetPrimarySuccess(payload, meta.sender?.endpoint));
    } catch (error) {
        yield put(vaultSetPrimaryFailure(payload, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(vaultSetPrimaryIntent.match, setPrimaryVault, options);
}

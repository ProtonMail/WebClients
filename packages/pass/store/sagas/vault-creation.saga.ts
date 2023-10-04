import { put, takeEvery } from 'redux-saga/effects';

import type { ShareType } from '@proton/pass/types';
import { type Share } from '@proton/pass/types';

import { vaultCreationFailure, vaultCreationIntent, vaultCreationSuccess } from '../actions';
import { createVault } from './workers/vaults';

function* createVaultWorker({ payload, meta }: ReturnType<typeof vaultCreationIntent>) {
    const { callback: onCreateVaultProcessed } = meta;
    try {
        const share: Share<ShareType.Vault> = yield createVault({ content: payload.content });

        const vaultCreationSuccessAction = vaultCreationSuccess({ id: payload.id, share });
        yield put(vaultCreationSuccessAction);

        onCreateVaultProcessed?.(vaultCreationSuccessAction);
    } catch (e) {
        const vaultCreationFailureAction = vaultCreationFailure(payload, e);
        yield put(vaultCreationFailureAction);

        onCreateVaultProcessed?.(vaultCreationFailureAction);
    }
}

export default function* watcher() {
    yield takeEvery(vaultCreationIntent.match, createVaultWorker);
}

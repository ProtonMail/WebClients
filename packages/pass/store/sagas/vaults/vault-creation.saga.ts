import { put, takeEvery } from 'redux-saga/effects';

import { createVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultCreationFailure, vaultCreationIntent, vaultCreationSuccess } from '@proton/pass/store/actions';
import type { ShareType } from '@proton/pass/types';
import { type Share } from '@proton/pass/types';

function* createVaultWorker({ payload, meta }: ReturnType<typeof vaultCreationIntent>) {
    const { callback: onCreateVaultProcessed } = meta;
    try {
        const share: Share<ShareType.Vault> = yield createVault({ content: payload.content });

        const vaultCreationSuccessAction = vaultCreationSuccess(meta.request.id, { share });
        yield put(vaultCreationSuccessAction);

        onCreateVaultProcessed?.(vaultCreationSuccessAction);
    } catch (e) {
        const vaultCreationFailureAction = vaultCreationFailure(meta.request.id, payload, e);
        yield put(vaultCreationFailureAction);

        onCreateVaultProcessed?.(vaultCreationFailureAction);
    }
}

export default function* watcher() {
    yield takeEvery(vaultCreationIntent.match, createVaultWorker);
}

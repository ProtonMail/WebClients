import { put, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { deleteVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultDeleteFailure, vaultDeleteIntent, vaultDeleteSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* deleteVaultWorker(
    { onItemsChange }: WorkerRootSagaOptions,
    { payload: { shareId, content }, meta }: ReturnType<typeof vaultDeleteIntent>
): Generator {
    try {
        yield deleteVault(shareId);
        PassCrypto.removeShare(shareId);

        yield put(vaultDeleteSuccess(meta.request.id, { shareId, content }));
        onItemsChange?.();
    } catch (e) {
        yield put(vaultDeleteFailure(meta.request.id, { shareId, content }, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(vaultDeleteIntent.match, deleteVaultWorker, options);
}

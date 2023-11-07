import { put } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { deleteVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultDeleteFailure, vaultDeleteIntent, vaultDeleteSuccess } from '@proton/pass/store/actions';
import { takeEveryBefore } from '@proton/pass/store/sagas/utils/take.before';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';

function* deleteVaultWorker(
    { payload: { shareId, content }, meta }: ReturnType<typeof vaultDeleteIntent>,
    stateBeforeAction: State,
    { onItemsChange }: WorkerRootSagaOptions
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
    yield takeEveryBefore(vaultDeleteIntent.match, deleteVaultWorker, options);
}

import { put } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { moveItems } from '@proton/pass/lib/items/item.requests';
import { deleteVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultDeleteFailure, vaultDeleteIntent, vaultDeleteSuccess } from '@proton/pass/store/actions';
import { takeEveryBefore } from '@proton/pass/store/sagas/utils/take.before';
import { selectItemsByShareId } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';

function* deleteVaultWorker(
    { payload: { shareId, content, destinationShareId }, meta }: ReturnType<typeof vaultDeleteIntent>,
    stateBeforeAction: State,
    { onItemsChange }: WorkerRootSagaOptions
): Generator {
    try {
        const items = selectItemsByShareId(stateBeforeAction, shareId);

        const movedItems = (yield destinationShareId !== null
            ? moveItems(items, destinationShareId)
            : []) as ItemRevision[];

        yield deleteVault(shareId);
        PassCrypto.removeShare(shareId);

        yield put(vaultDeleteSuccess(meta.request.id, { shareId, content, movedItems }));
        onItemsChange?.();
    } catch (e) {
        yield put(vaultDeleteFailure(meta.request.id, { shareId, content }, e));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEveryBefore(vaultDeleteIntent.match, deleteVaultWorker, options);
}

import { put, select, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { deleteVault } from '@proton/pass/lib/vaults/vault.requests';
import {
    getUserAccessIntent,
    vaultDeleteFailure,
    vaultDeleteIntent,
    vaultDeleteSuccess,
} from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { selectUserDefaultShareId } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* deleteVaultWorker(
    { onItemsUpdated, getAuthStore }: RootSagaOptions,
    { payload: { shareId, content }, meta }: ReturnType<typeof vaultDeleteIntent>
) {
    try {
        yield deleteVault(shareId);
        PassCrypto.removeShare(shareId);

        /* Handle edge case when the alias sync vault is deleted:
         * we check the new alias sync vault from BE in the user access route */
        const userID = getAuthStore().getUserID();
        const aliasSyncShareId: string = yield select(selectUserDefaultShareId);
        if (shareId === aliasSyncShareId) yield put(withRevalidate(getUserAccessIntent(userID!)));

        yield put(vaultDeleteSuccess(meta.request.id, { shareId, content }));
        onItemsUpdated?.();
    } catch (e) {
        yield put(vaultDeleteFailure(meta.request.id, { shareId, content }, e));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(vaultDeleteIntent.match, deleteVaultWorker, options);
}

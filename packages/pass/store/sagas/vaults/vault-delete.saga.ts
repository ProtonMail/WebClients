import { put, select, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { deleteVault } from '@proton/pass/lib/vaults/vault.requests';
import {
    getUserAccessIntent,
    lockShare,
    unlockShare,
    vaultDeleteFailure,
    vaultDeleteIntent,
    vaultDeleteSuccess,
} from '@proton/pass/store/actions';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { isShareLocked, selectUserDefaultShareID } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { Maybe } from '@proton/pass/types';

function* deleteVaultWorker(
    { onItemsUpdated, getAuthStore }: RootSagaOptions,
    { payload: { shareId, content }, meta }: ReturnType<typeof vaultDeleteIntent>
) {
    try {
        const shareLocked: boolean = yield select(isShareLocked(shareId));
        if (shareLocked) throw new Error();

        yield put(lockShare(shareId));
        yield deleteVault(shareId);
        PassCrypto.removeShare(shareId);

        /* Handle edge case when the alias sync vault is deleted:
         * we check the new alias sync vault from BE in the user access route */
        const userID = getAuthStore().getUserID();
        const aliasSyncShareId: Maybe<string> = yield select(selectUserDefaultShareID);
        if (shareId === aliasSyncShareId) yield put(withRevalidate(getUserAccessIntent(userID!)));

        yield put(vaultDeleteSuccess(meta.request.id, { shareId, content }));
        onItemsUpdated?.();
    } catch (e) {
        yield put(vaultDeleteFailure(meta.request.id, { shareId, content }, e));
    } finally {
        yield put(unlockShare(shareId));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(vaultDeleteIntent.match, deleteVaultWorker, options);
}

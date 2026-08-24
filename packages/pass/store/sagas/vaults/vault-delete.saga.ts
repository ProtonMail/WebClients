import { put, select, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '../../../lib/crypto';
import { deleteVault } from '../../../lib/vaults/vault.requests';
import type { Maybe } from '../../../types';
import { getUserAccessIntent, lockShare, unlockShare, vaultDeleteFailure, vaultDeleteIntent, vaultDeleteSuccess } from '../../actions';
import { withRevalidate } from '../../request/enhancers';
import { isShareLocked, selectUserDefaultShareID } from '../../selectors';
import type { RootSagaOptions } from '../../types';

function* deleteVaultWorker(
    { getAuthStore }: RootSagaOptions,
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
    } catch (e) {
        yield put(vaultDeleteFailure(meta.request.id, { shareId, content }, e));
    } finally {
        yield put(unlockShare(shareId));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(vaultDeleteIntent.match, deleteVaultWorker, options);
}

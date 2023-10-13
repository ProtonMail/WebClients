import { put, takeEvery } from 'redux-saga/effects';

import { editVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultEditFailure, vaultEditIntent, vaultEditSuccess } from '@proton/pass/store/actions';
import type { ShareType } from '@proton/pass/types';
import { type Share } from '@proton/pass/types';

function* editVaultWorker({ payload }: ReturnType<typeof vaultEditIntent>) {
    try {
        const share: Share<ShareType.Vault> = yield editVault(payload.id, payload.content);
        yield put(vaultEditSuccess({ id: payload.id, share }));
    } catch (e) {
        yield put(vaultEditFailure(payload, e));
    }
}

export default function* watcher() {
    yield takeEvery(vaultEditIntent.match, editVaultWorker);
}

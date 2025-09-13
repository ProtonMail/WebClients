import { put, select, takeEvery } from 'redux-saga/effects';

import { editVault } from '@proton/pass/lib/vaults/vault.requests';
import { vaultEditFailure, vaultEditIntent, vaultEditSuccess } from '@proton/pass/store/actions';
import { selectShareOrThrow } from '@proton/pass/store/selectors';
import type { Share, ShareType } from '@proton/pass/types';

function* editVaultWorker({ payload, meta }: ReturnType<typeof vaultEditIntent>) {
    try {
        const vault: Share<ShareType.Vault> = yield select(selectShareOrThrow<ShareType.Vault>(payload.shareId));
        const share: Share<ShareType.Vault> = yield editVault(payload.shareId, payload.content, vault.eventId);
        yield put(vaultEditSuccess(meta.request.id, { share }));
    } catch (e) {
        yield put(vaultEditFailure(meta.request.id, payload, e));
    }
}

export default function* watcher() {
    yield takeEvery(vaultEditIntent.match, editVaultWorker);
}

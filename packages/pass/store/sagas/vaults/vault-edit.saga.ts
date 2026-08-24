import { put, select, takeEvery } from 'redux-saga/effects';

import { editVault } from '../../../lib/vaults/vault.requests';
import type { Share, ShareType } from '../../../types';
import { vaultEditFailure, vaultEditIntent, vaultEditSuccess } from '../../actions';
import { selectShareOrThrow } from '../../selectors';

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

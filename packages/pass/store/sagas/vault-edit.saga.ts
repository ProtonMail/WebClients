import { put, takeEvery } from 'redux-saga/effects';

import type { ShareType } from '@proton/pass/types';
import { type Share } from '@proton/pass/types';

import { acknowledgeRequest, vaultEditFailure, vaultEditIntent, vaultEditSuccess } from '../actions';
import { editVault } from './workers/vaults';

function* editVaultWorker({ payload, meta }: ReturnType<typeof vaultEditIntent>) {
    try {
        const share: Share<ShareType.Vault> = yield editVault(payload.id, payload.content);
        yield put(vaultEditSuccess({ id: payload.id, share }));
    } catch (e) {
        yield put(vaultEditFailure(payload, e));
    } finally {
        yield put(acknowledgeRequest(meta.request.id));
    }
}

export default function* watcher() {
    yield takeEvery(vaultEditIntent.match, editVaultWorker);
}

import { put, takeEvery } from 'redux-saga/effects';

import { vaultTransferOwner } from '@proton/pass/lib/vaults/vault.requests';
import {
    vaultTransferOwnerIntent,
    vaultTransferOwnershipFailure,
    vaultTransferOwnershipSuccess,
} from '@proton/pass/store/actions';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof vaultTransferOwnerIntent>) {
    try {
        yield vaultTransferOwner(payload);
        yield put(vaultTransferOwnershipSuccess(request.id, payload.shareId, payload.userShareId));
    } catch (err) {
        yield put(vaultTransferOwnershipFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(vaultTransferOwnerIntent.match, resendInviteWorker);
}

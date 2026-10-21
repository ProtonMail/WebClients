import { put, takeEvery } from 'redux-saga/effects';

import { vaultTransferOwner } from '../../../lib/vaults/vault.requests';
import { syncShare } from '../../actions/creators/polling';
import { vaultTransferOwnerIntent, vaultTransferOwnershipFailure, vaultTransferOwnershipSuccess } from '../../actions/creators/vault';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof vaultTransferOwnerIntent>) {
    try {
        yield vaultTransferOwner(payload);
        yield put(vaultTransferOwnershipSuccess(request.id, payload.shareId, payload.userShareId));
        yield put(syncShare(payload.shareId));
    } catch (err) {
        yield put(vaultTransferOwnershipFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(vaultTransferOwnerIntent.match, resendInviteWorker);
}

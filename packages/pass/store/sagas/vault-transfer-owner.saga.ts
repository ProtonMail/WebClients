import { put, takeEvery } from 'redux-saga/effects';

import { vaultTransferOwnerIntent, vaultTransferOwnershipFailure, vaultTransferOwnershipSuccess } from '../actions';
import { vaultTransferOwner } from './workers/vaults';

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

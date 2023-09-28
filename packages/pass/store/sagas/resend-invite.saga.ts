import { put, takeEvery } from 'redux-saga/effects';

import { vaultInviteResendIntent } from '../actions';
import { vaultInviteResendFailure, vaultInviteResendSuccess } from '../actions';
import { resendVaultInvite } from './workers/invite';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof vaultInviteResendIntent>) {
    try {
        yield resendVaultInvite(payload);
        yield put(vaultInviteResendSuccess(request.id, payload.shareId, payload.inviteId));
    } catch (err) {
        yield put(vaultInviteResendFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(vaultInviteResendIntent.match, resendInviteWorker);
}

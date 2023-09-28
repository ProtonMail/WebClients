import { put, takeEvery } from 'redux-saga/effects';

import { inviteResendFailure, inviteResendIntent, inviteResendSuccess } from '../actions';
import { resendVaultInvite } from './workers/invite';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteResendIntent>) {
    try {
        yield resendVaultInvite(payload);
        yield put(inviteResendSuccess(request.id, payload.shareId, payload.inviteId));
    } catch (err) {
        yield put(inviteResendFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteResendIntent.match, resendInviteWorker);
}

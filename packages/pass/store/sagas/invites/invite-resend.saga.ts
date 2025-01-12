import { put, takeEvery } from 'redux-saga/effects';

import { resendInvite } from '@proton/pass/lib/invites/invite.requests';
import { inviteResendFailure, inviteResendIntent, inviteResendSuccess } from '@proton/pass/store/actions';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteResendIntent>) {
    try {
        yield resendInvite(payload);
        yield put(inviteResendSuccess(request.id, payload));
    } catch (err) {
        yield put(inviteResendFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteResendIntent.match, resendInviteWorker);
}

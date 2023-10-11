import { put, takeEvery } from 'redux-saga/effects';

import { rejectInvite } from '@proton/pass/lib/invites/invite.requests';
import { inviteRejectIntent, inviteRejectSuccess, inviteResendFailure } from '@proton/pass/store/actions';

function* rejectInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteRejectIntent>) {
    try {
        yield rejectInvite(payload);
        yield put(inviteRejectSuccess(request.id, payload.inviteToken));
    } catch (err) {
        yield put(inviteResendFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteRejectIntent.match, rejectInviteWorker);
}

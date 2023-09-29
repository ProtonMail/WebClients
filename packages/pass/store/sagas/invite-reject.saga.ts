import { put, takeEvery } from 'redux-saga/effects';

import { inviteRejectIntent, inviteRejectSuccess, inviteResendFailure } from '../actions';
import { rejectInvite } from './workers/invite';

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

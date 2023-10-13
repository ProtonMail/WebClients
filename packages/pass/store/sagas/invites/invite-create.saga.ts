import { put, takeEvery } from 'redux-saga/effects';

import { createInvite } from '@proton/pass/lib/invites/invite.requests';
import { inviteCreationFailure, inviteCreationIntent, inviteCreationSuccess } from '@proton/pass/store/actions';

function* createInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteCreationIntent>) {
    try {
        yield createInvite(payload);
        yield put(inviteCreationSuccess(request.id, payload.shareId));
    } catch (err) {
        yield put(inviteCreationFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteCreationIntent.match, createInviteWorker);
}

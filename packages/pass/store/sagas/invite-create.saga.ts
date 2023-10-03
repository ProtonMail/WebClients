import { put, takeEvery } from 'redux-saga/effects';

import { inviteCreationFailure, inviteCreationIntent, inviteCreationSuccess } from '../actions';
import { createInvite } from './workers/invite';

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

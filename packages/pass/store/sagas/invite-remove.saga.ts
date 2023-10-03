import { put, takeEvery } from 'redux-saga/effects';

import { inviteRemoveFailure, inviteRemoveIntent, inviteRemoveSuccess } from '../actions';
import { removeInvite } from './workers/invite';

function* removeInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteRemoveIntent>) {
    try {
        yield removeInvite(payload);
        yield put(inviteRemoveSuccess(request.id, payload.shareId, payload.inviteId));
    } catch (err) {
        yield put(inviteRemoveFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteRemoveIntent.match, removeInviteWorker);
}

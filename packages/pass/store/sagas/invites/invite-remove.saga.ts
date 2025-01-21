import { put, takeEvery } from 'redux-saga/effects';

import { removeInvite } from '@proton/pass/lib/invites/invite.requests';
import { inviteRemoveFailure, inviteRemoveIntent, inviteRemoveSuccess } from '@proton/pass/store/actions';
import { syncAccess } from '@proton/pass/store/actions/creators/polling';

function* removeInviteWorker({ payload, meta: { request } }: ReturnType<typeof inviteRemoveIntent>) {
    try {
        yield removeInvite(payload);
        yield put(inviteRemoveSuccess(request.id, payload));
        yield put(syncAccess(payload));
    } catch (err) {
        yield put(inviteRemoveFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(inviteRemoveIntent.match, removeInviteWorker);
}

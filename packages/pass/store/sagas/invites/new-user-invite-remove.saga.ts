import { put, takeEvery } from 'redux-saga/effects';

import { removeNewUserInvite } from '@proton/pass/lib/invites/invite.requests';
import {
    newUserInviteRemoveFailure,
    newUserInviteRemoveIntent,
    newUserInviteRemoveSuccess,
} from '@proton/pass/store/actions';

function* removeInviteWorker({ payload, meta: { request } }: ReturnType<typeof newUserInviteRemoveIntent>) {
    try {
        yield removeNewUserInvite(payload);
        yield put(newUserInviteRemoveSuccess(request.id, payload));
    } catch (err) {
        yield put(newUserInviteRemoveFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(newUserInviteRemoveIntent.match, removeInviteWorker);
}

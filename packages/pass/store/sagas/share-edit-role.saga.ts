import { put, takeEvery } from 'redux-saga/effects';

import { shareEditMemberAccessIntent } from '../actions';
import { shareEditMemberAccessFailure, shareEditMemberAccessSuccess } from '../actions';
import { editMemberAccess } from './workers/shares';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof shareEditMemberAccessIntent>) {
    try {
        yield editMemberAccess(payload);
        yield put(shareEditMemberAccessSuccess(request.id, payload.shareId, payload.userShareId, payload.shareRoleId));
    } catch (err) {
        yield put(shareEditMemberAccessFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(shareEditMemberAccessIntent.match, resendInviteWorker);
}

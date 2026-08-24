import { put, takeEvery } from 'redux-saga/effects';

import { editMemberAccess } from '../../../lib/shares/share.requests';
import { shareEditMemberAccessFailure, shareEditMemberAccessIntent, shareEditMemberAccessSuccess } from '../../actions';

function* resendInviteWorker({ payload, meta: { request } }: ReturnType<typeof shareEditMemberAccessIntent>) {
    try {
        yield editMemberAccess(payload);
        yield put(shareEditMemberAccessSuccess(request.id, payload));
    } catch (err) {
        yield put(shareEditMemberAccessFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(shareEditMemberAccessIntent.match, resendInviteWorker);
}

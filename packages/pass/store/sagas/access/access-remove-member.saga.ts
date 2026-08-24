import { put, takeEvery } from 'redux-saga/effects';

import { removeUserAccess } from '../../../lib/shares/share.requests';
import { shareRemoveMemberAccessFailure, shareRemoveMemberAccessIntent, shareRemoveMemberAccessSuccess } from '../../actions';
import { syncAccess } from '../../actions/creators/polling';

function* removeUserAccessWorker({ payload, meta: { request } }: ReturnType<typeof shareRemoveMemberAccessIntent>) {
    try {
        yield removeUserAccess(payload);
        yield put(shareRemoveMemberAccessSuccess(request.id, payload));
        yield put(syncAccess(payload));
    } catch (err) {
        yield put(shareRemoveMemberAccessFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(shareRemoveMemberAccessIntent.match, removeUserAccessWorker);
}

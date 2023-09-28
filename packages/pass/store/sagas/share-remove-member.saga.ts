import { put, takeEvery } from 'redux-saga/effects';

import {
    shareRemoveMemberAccessFailure,
    shareRemoveMemberAccessIntent,
    shareRemoveMemberAccessSuccess,
} from '../actions';
import { removeUserAccess } from './workers/shares';

function* removeUserAccessWorker({ payload, meta: { request } }: ReturnType<typeof shareRemoveMemberAccessIntent>) {
    try {
        yield removeUserAccess(payload);
        yield put(shareRemoveMemberAccessSuccess(request.id, payload.shareId, payload.userShareId));
    } catch (err) {
        yield put(shareRemoveMemberAccessFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(shareRemoveMemberAccessIntent.match, removeUserAccessWorker);
}

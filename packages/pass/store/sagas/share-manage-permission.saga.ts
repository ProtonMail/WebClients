import { put, takeEvery } from 'redux-saga/effects';

import { vaultRemoveAccessFailure, vaultRemoveAccessIntent, vaultRemoveAccessSuccess } from '../actions';
import { removeUserAccess } from './workers/shares';

function* removeUserAccessWorker({ payload, meta: { request } }: ReturnType<typeof vaultRemoveAccessIntent>) {
    try {
        yield removeUserAccess(payload);
        yield put(vaultRemoveAccessSuccess(request.id, payload.shareId, payload.userShareId));
    } catch (err) {
        yield put(vaultRemoveAccessFailure(request.id, err));
    }
}

export default function* watcher() {
    yield takeEvery(vaultRemoveAccessIntent.match, removeUserAccessWorker);
}

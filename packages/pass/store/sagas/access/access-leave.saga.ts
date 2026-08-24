import { put, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '../../../lib/crypto';
import { deleteShare } from '../../../lib/shares/share.requests';
import { shareLeaveFailure, shareLeaveIntent, shareLeaveSuccess } from '../../actions';

function* shareLeaveWorker({ payload, meta: { request } }: ReturnType<typeof shareLeaveIntent>) {
    const { shareId, targetType } = payload;

    try {
        yield deleteShare(shareId);
        PassCrypto.removeShare(shareId);
        yield put(shareLeaveSuccess(request.id, shareId, targetType));
    } catch (err) {
        yield put(shareLeaveFailure(request.id, targetType, err));
    }
}

export default function* watcher() {
    yield takeEvery(shareLeaveIntent.match, shareLeaveWorker);
}

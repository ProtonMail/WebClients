import { put, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import { deleteShare } from '@proton/pass/lib/shares/share.requests';
import { shareLeaveFailure, shareLeaveIntent, shareLeaveSuccess } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* shareLeaveWorker(
    { onItemsUpdated }: RootSagaOptions,
    { payload, meta: { request } }: ReturnType<typeof shareLeaveIntent>
) {
    const { shareId, targetType } = payload;

    try {
        yield deleteShare(shareId);
        PassCrypto.removeShare(shareId);
        onItemsUpdated?.();

        yield put(shareLeaveSuccess(request.id, shareId, targetType));
    } catch (err) {
        yield put(shareLeaveFailure(request.id, targetType, err));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(shareLeaveIntent.match, shareLeaveWorker, options);
}

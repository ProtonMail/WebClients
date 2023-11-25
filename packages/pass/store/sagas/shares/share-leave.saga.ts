import { put, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto/pass-crypto';
import { deleteShare } from '@proton/pass/lib/shares/share.requests';
import { shareLeaveFailure, shareLeaveIntent, shareLeaveSuccess } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* shareLeaveWorker(
    { onShareDeleted, onItemsUpdated }: RootSagaOptions,
    { payload, meta: { request } }: ReturnType<typeof shareLeaveIntent>
) {
    try {
        const { shareId } = payload;
        yield deleteShare(shareId);

        PassCrypto.removeShare(shareId);
        onShareDeleted?.(shareId);
        onItemsUpdated?.();

        yield put(shareLeaveSuccess(request.id, payload.shareId));
    } catch (err) {
        yield put(shareLeaveFailure(request.id, err));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(shareLeaveIntent.match, shareLeaveWorker, options);
}

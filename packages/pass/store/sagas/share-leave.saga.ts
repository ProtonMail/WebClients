import { put, takeEvery } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/crypto';

import { shareLeaveFailure, shareLeaveIntent, shareLeaveSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';
import { deleteShare } from './workers/shares';

function* shareLeaveWorker(
    { onShareEventDisabled }: WorkerRootSagaOptions,
    { payload, meta: { request } }: ReturnType<typeof shareLeaveIntent>
) {
    try {
        const { shareId } = payload;
        yield deleteShare(shareId);

        PassCrypto.removeShare(shareId);
        onShareEventDisabled?.(shareId);

        yield put(shareLeaveSuccess(request.id, payload.shareId));
    } catch (err) {
        yield put(shareLeaveFailure(request.id, err));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(shareLeaveIntent.match, shareLeaveWorker, options);
}

import { put, takeLeading } from 'redux-saga/effects';

import { unlock } from '@proton/pass/store/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';

function* unlockWorker(
    { getAuthService }: RootSagaOptions,
    { payload, meta: { callback: onUnlock, request } }: ReturnType<typeof unlock.intent>
) {
    try {
        yield getAuthService().unlock(payload.mode, payload.secret);
        const successMessage = unlock.success(request.id, payload.mode);
        yield put(successMessage);

        onUnlock?.(successMessage);
    } catch (err: any) {
        const failureMessage = unlock.failure(request.id, err, payload.mode);

        yield put(failureMessage);
        onUnlock?.(failureMessage);
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(unlock.intent.match, unlockWorker, options);
}

import { put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { sessionUnlockFailure, sessionUnlockIntent, sessionUnlockSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* unlockSessionWorker(
    { getAuthService }: WorkerRootSagaOptions,
    { payload, meta: { callback: onUnlockResult, request } }: ReturnType<typeof sessionUnlockIntent>
) {
    try {
        const sessionLockToken: string = yield getAuthService().unlock(payload.pin);
        const successMessage = sessionUnlockSuccess(request.id, { sessionLockToken });
        yield put(successMessage);
        onUnlockResult?.(successMessage);
    } catch (err: any) {
        const inactiveSession = err.name === 'InactiveSession';

        const failureMessage = sessionUnlockFailure(request.id, err, {
            canRetry: !inactiveSession,
            error: inactiveSession
                ? c('Error').t`Too many failed attempts. Please sign in again.`
                : c('Error').t`Wrong PIN code. Try again.`,
        });

        yield put(failureMessage);
        onUnlockResult?.(failureMessage);
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionUnlockIntent.match, unlockSessionWorker, options);
}

import { put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { unlockSession } from '@proton/pass/lib/auth/session-lock';
import { sessionUnlockFailure, sessionUnlockIntent, sessionUnlockSuccess } from '@proton/pass/store/actions';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';

function* unlockSessionWorker(
    { onSessionUnlocked, onSignout }: WorkerRootSagaOptions,
    { payload, meta: { callback: onUnlockResult } }: ReturnType<typeof sessionUnlockIntent>
) {
    try {
        const sessionLockToken: string = yield unlockSession(payload.pin);
        const successMessage = sessionUnlockSuccess({ sessionLockToken });

        yield put(successMessage);
        yield onSessionUnlocked?.(sessionLockToken);

        onUnlockResult?.(successMessage);
    } catch (err: any) {
        const inactiveSession = err.name === 'InactiveSession';
        if (inactiveSession) onSignout?.();

        const failureMessage = sessionUnlockFailure(err, {
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

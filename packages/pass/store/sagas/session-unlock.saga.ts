import { fork, put, takeLeading } from 'redux-saga/effects';
import { c } from 'ttag';

import { unlockSession } from '@proton/pass/auth/session-lock';
import { wait } from '@proton/shared/lib/helpers/promise';

import {
    acknowledgeRequest,
    extendLock,
    sessionUnlockFailure,
    sessionUnlockIntent,
    sessionUnlockSuccess,
} from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* unlockSessionWorker(
    { onSessionUnlocked, onSignout }: WorkerRootSagaOptions,
    { payload, meta: { request, callback: onUnlockResult } }: ReturnType<typeof sessionUnlockIntent>
) {
    try {
        const storageToken: string = yield unlockSession(payload.pin);
        const successMessage = sessionUnlockSuccess({ storageToken });

        yield put(successMessage);
        onUnlockResult?.(successMessage);
        onSessionUnlocked?.(storageToken);

        /* trigger a lock extension action in order to
         * to sync the session lock state in the store */
        yield put(extendLock());
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
    } finally {
        yield fork(function* () {
            yield wait(500);
            yield put(acknowledgeRequest(request.id));
        });
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionUnlockIntent.match, unlockSessionWorker, options);
}

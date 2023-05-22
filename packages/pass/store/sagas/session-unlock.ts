import { fork, put, takeLeading } from 'redux-saga/effects';

import { unlockSession } from '@proton/pass/auth/session-lock';
import { wait } from '@proton/shared/lib/helpers/promise';

import { acknowledgeRequest, sessionUnlockFailure, sessionUnlockIntent, sessionUnlockSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* unlockSessionWorker(
    { onSessionUnlocked }: WorkerRootSagaOptions,
    { payload, meta }: ReturnType<typeof sessionUnlockIntent>
) {
    try {
        const storageToken: string = yield unlockSession(payload.pin);
        yield put(sessionUnlockSuccess({ storageToken }));
        onSessionUnlocked?.(storageToken);
    } catch (e) {
        yield put(sessionUnlockFailure(e));
    } finally {
        yield fork(function* () {
            yield wait(500);
            yield put(acknowledgeRequest(meta.request.id));
        });
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeLeading(sessionUnlockIntent.match, unlockSessionWorker, options);
}

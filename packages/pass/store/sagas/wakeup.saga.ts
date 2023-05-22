import { put, select, take, takeEvery } from 'redux-saga/effects';

import { authentication } from '@proton/pass/auth';
import { WorkerStatus } from '@proton/pass/types';

import * as action from '../actions';
import { boot, stateSync, wakeupSuccess } from '../actions';
import type { WithReceiverAction } from '../actions/with-receiver';
import type { State } from '../types';

function* wakeupWorker({ payload: { status }, meta }: WithReceiverAction<ReturnType<typeof action.wakeup>>) {
    const { tabId, endpoint } = meta.receiver;
    const loggedIn = authentication?.hasSession();

    switch (status) {
        case WorkerStatus.IDLE:
        case WorkerStatus.ERROR: {
            if (loggedIn) {
                yield put(boot({}));
                yield take(action.bootSuccess.match);
            }
            break;
        }
        case WorkerStatus.BOOTING:
        case WorkerStatus.RESUMING: {
            yield take(action.bootSuccess.match);
            break;
        }
        default: {
            break;
        }
    }

    /* synchronise the consumer app */
    yield put(stateSync((yield select()) as State, { endpoint, tabId }));
    yield put(wakeupSuccess(endpoint!, tabId!));
}

export default function* wakeup(): Generator {
    yield takeEvery(action.wakeup.match, wakeupWorker);
}

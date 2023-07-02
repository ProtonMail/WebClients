import { fork, put, select, take, takeEvery } from 'redux-saga/effects';

import { filterDeletedTabIds } from '@proton/pass/extension/tabs';
import type { TabId } from '@proton/pass/types';
import { WorkerStatus } from '@proton/pass/types';

import * as action from '../actions';
import { boot, stateSync, wakeupSuccess } from '../actions';
import { popupTabStateGarbageCollect } from '../actions/creators/popup';
import { passwordHistoryGarbageCollect } from '../actions/creators/pw-history';
import type { WithReceiverAction } from '../actions/with-receiver';
import { selectPopupStateTabIds } from '../selectors';
import type { State, WorkerRootSagaOptions } from '../types';

function* wakeupWorker(
    { getAuth }: WorkerRootSagaOptions,
    { payload: { status }, meta }: WithReceiverAction<ReturnType<typeof action.wakeup>>
) {
    const { tabId, endpoint } = meta.receiver;
    const loggedIn = getAuth().hasSession();

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

    /* garbage collect any stale popup tab
     * state on each popup wakeup call */
    if (endpoint === 'popup') {
        yield fork(function* () {
            yield put(passwordHistoryGarbageCollect());

            const tabIds: TabId[] = yield select(selectPopupStateTabIds);
            const deletedTabIds: TabId[] = yield filterDeletedTabIds(tabIds);
            yield put(popupTabStateGarbageCollect({ tabIds: deletedTabIds }));
        });
    }

    yield put(wakeupSuccess(endpoint!, tabId!));
}

export default function* wakeup(options: WorkerRootSagaOptions): Generator {
    yield takeEvery(action.wakeup.match, wakeupWorker, options);
}

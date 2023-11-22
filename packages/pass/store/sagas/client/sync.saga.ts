import { call, put, race, select, take } from 'redux-saga/effects';

import {
    getUserAccessIntent,
    getUserFeaturesIntent,
    startEventPolling,
    stateDestroy,
    stopEventPolling,
    syncFailure,
    syncIntent,
    syncSuccess,
} from '@proton/pass/store/actions';
import { userAccessRequest, userFeaturesRequest } from '@proton/pass/store/actions/requests';
import { withRevalidate } from '@proton/pass/store/actions/with-request';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import { selectUser } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import { wait } from '@proton/shared/lib/helpers/promise';

function* syncWorker(options: WorkerRootSagaOptions) {
    yield put(stopEventPolling());

    const state = (yield select()) as State;
    const user = selectUser(state);

    if (!user) return;

    try {
        yield wait(1500);

        yield put(withRevalidate(getUserAccessIntent(userAccessRequest(user.ID))));
        yield put(withRevalidate(getUserFeaturesIntent(userFeaturesRequest(user.ID))));

        yield put(syncSuccess(yield call(synchronize, { type: SyncType.FULL }, options)));
    } catch (e: unknown) {
        yield put(syncFailure(e));
    } finally {
        yield put(startEventPolling());
    }
}

/* The `syncWorker` function can take a long time to complete. In order to avoid conflicts
 * with any state resetting actions, we race the `sync` against such actions. */
export default function* watcher(options: WorkerRootSagaOptions): Generator {
    while (true) {
        yield call(function* () {
            yield take(syncIntent.match);
            yield race({
                sync: syncWorker(options),
                cancel: take(stateDestroy.match),
            });
        });
    }
}

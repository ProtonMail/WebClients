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
import { getOrganizationSettingsIntent } from '@proton/pass/store/actions/creators/organization';
import { withRevalidate } from '@proton/pass/store/actions/enhancers/request';
import { synchronize } from '@proton/pass/store/sagas/client/sync';
import { selectUser } from '@proton/pass/store/selectors';
import type { State } from '@proton/pass/store/types';
import { wait } from '@proton/shared/lib/helpers/promise';

function* syncWorker({ payload }: ReturnType<typeof syncIntent>) {
    yield put(stopEventPolling());

    const state = (yield select()) as State;
    const user = selectUser(state);

    if (!user) return;

    try {
        yield wait(1500);

        yield put(withRevalidate(getUserAccessIntent(user.ID)));
        yield put(withRevalidate(getUserFeaturesIntent(user.ID)));
        yield put(withRevalidate(getOrganizationSettingsIntent()));

        yield put(syncSuccess(yield call(synchronize, payload.type)));
    } catch (e: unknown) {
        yield put(syncFailure(e));
    } finally {
        yield put(startEventPolling());
    }
}

/* The `syncWorker` function can take a long time to complete. In order to avoid conflicts
 * with any state resetting actions, we race the `sync` against such actions. */
export default function* watcher(): Generator {
    while (true) {
        yield call(function* () {
            const action: ReturnType<typeof syncIntent> = yield take(syncIntent.match);
            yield race({
                sync: syncWorker(action),
                cancel: take(stateDestroy.match),
            });
        });
    }
}

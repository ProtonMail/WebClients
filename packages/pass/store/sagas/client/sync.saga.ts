import { call, put, race, select, take } from 'redux-saga/effects';

import {
    getUserAccessIntent,
    getUserFeaturesIntent,
    syncFailure,
    syncIntent,
    syncSuccess,
} from '@proton/pass/store/actions';
import { userAccessRequest, userFeaturesRequest } from '@proton/pass/store/actions/requests';
import { isStateResetAction } from '@proton/pass/store/actions/utils';
import { withRevalidate } from '@proton/pass/store/actions/with-request';
import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import { reducerMap } from '@proton/pass/store/reducers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/client/sync';
import { SyncType, synchronize } from '@proton/pass/store/sagas/client/sync';
import { selectFeatureFlags, selectUser } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import { wait } from '@proton/shared/lib/helpers/promise';

function* syncWorker(options: WorkerRootSagaOptions, { meta }: ReturnType<typeof syncIntent>) {
    const state = (yield select()) as State;
    const user = selectUser(state);

    if (!user) return;

    try {
        yield wait(1500);

        yield put(withRevalidate(getUserAccessIntent(userAccessRequest(user.ID))));
        yield put(withRevalidate(getUserFeaturesIntent(userFeaturesRequest(user.ID))));

        const sync: SynchronizationResult = yield call(
            synchronize,
            asIfNotOptimistic(state, reducerMap),
            SyncType.FULL,
            yield select(selectFeatureFlags),
            options
        );

        yield put(syncSuccess(meta.request.id, sync));
    } catch (e: unknown) {
        yield put(syncFailure(meta.request.id, e));
    }
}

/* The `syncWorker` function can take a long time to complete. In order
 * to avoid conflicts with any state resetting actions, we race the `sync`
 * against such actions. For example, if the user's session is revoked during
 * a sync, we want to avoid dispatching the `syncFailure` action as it will
 * re-spawn the event channels. Instead, we cancel the sync task using the
 * `isStateResetAction` predicate, which checks if the given action is a state
 * resetting action (e.g. stateDestroy, stateLock, signout etc..) */
export default function* watcher(options: WorkerRootSagaOptions): Generator {
    while (true) {
        yield call(function* () {
            const action: ReturnType<typeof syncIntent> = yield take(syncIntent.match);
            yield race({
                sync: syncWorker(options, action),
                cancel: take(isStateResetAction),
            });
        });
    }
}

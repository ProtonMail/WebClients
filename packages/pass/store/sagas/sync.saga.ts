import { call, fork, put, race, select, take } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';

import { setUserFeatures, setUserPlan, syncFailure, syncIntent, syncSuccess } from '../actions';
import { isStateResetAction } from '../actions/utils';
import { asIfNotOptimistic } from '../optimistic/selectors/select-is-optimistic';
import type { UserFeatureState } from '../reducers';
import { type UserPlanState, reducerMap } from '../reducers';
import type { State, WorkerRootSagaOptions } from '../types';
import { SyncType, type SynchronizationResult, synchronize } from './workers/sync';
import { getUserFeatures, getUserPlan } from './workers/user';

function* syncWorker(options: WorkerRootSagaOptions) {
    const state = (yield select()) as State;
    try {
        yield wait(1500);

        yield fork(function* () {
            const plan: UserPlanState = yield getUserPlan(state.user, { force: true });
            yield put(setUserPlan(plan));

            const feature: UserFeatureState = yield getUserFeatures(state.user, { force: true });
            yield put(setUserFeatures(feature));
        });

        const sync: SynchronizationResult = yield call(
            synchronize,
            asIfNotOptimistic(state, reducerMap),
            SyncType.FULL,
            options
        );

        yield put(syncSuccess(sync));
    } catch (e: unknown) {
        yield put(syncFailure(e));
    }
}

/* The `syncWorker` function can take a long time to complete. In order
 * to avoid conflicts with any state resetting actions, we race the `sync`
 * against such actions. For example, if the user's session is evoked during
 * a sync, we want to avoid dispatching the `syncFailure` action as it will
 * re-spawn the event channels. Instead, we cancel the sync task using the
 * `isStateResetAction` predicate, which checks if the given action is a state
 * resetting action (e.g. stateDestroy, stateLock, signout) */
export default function* watcher(options: WorkerRootSagaOptions): Generator {
    while (true) {
        yield call(function* () {
            yield take(syncIntent.match);
            yield race({
                sync: syncWorker(options),
                cancel: take(isStateResetAction),
            });
        });
    }
}

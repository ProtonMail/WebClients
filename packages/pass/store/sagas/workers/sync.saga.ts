import { call, fork, put, race, select, take } from 'redux-saga/effects';

import { getFeatureFlags, getUserPlan } from '@proton/pass/lib/user/user.requests';
import { setUserFeatures, setUserPlan, syncFailure, syncIntent, syncSuccess } from '@proton/pass/store/actions';
import { isStateResetAction } from '@proton/pass/store/actions/utils';
import { asIfNotOptimistic } from '@proton/pass/store/optimistic/selectors/select-is-optimistic';
import type { FeatureFlagState, UserPlanState } from '@proton/pass/store/reducers';
import { reducerMap } from '@proton/pass/store/reducers';
import type { SynchronizationResult } from '@proton/pass/store/sagas/workers/sync';
import { SyncType, synchronize } from '@proton/pass/store/sagas/workers/sync';
import { selectFeatureFlags } from '@proton/pass/store/selectors';
import type { State, WorkerRootSagaOptions } from '@proton/pass/store/types';
import { wait } from '@proton/shared/lib/helpers/promise';

function* syncWorker(options: WorkerRootSagaOptions) {
    const state = (yield select()) as State;
    try {
        yield wait(1500);

        yield fork(function* () {
            const plan: UserPlanState = yield getUserPlan(state.user, { force: true });
            yield put(setUserPlan(plan));

            const features: FeatureFlagState = yield getFeatureFlags(state.user, { force: true });
            yield put(setUserFeatures(features));
        });

        const sync: SynchronizationResult = yield call(
            synchronize,
            asIfNotOptimistic(state, reducerMap),
            SyncType.FULL,
            yield select(selectFeatureFlags),
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

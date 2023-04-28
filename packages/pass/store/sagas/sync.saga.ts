import { call, put, race, select, take } from 'redux-saga/effects';

import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';

import { syncFailure, syncIntent, syncSuccess } from '../actions';
import { isStateResetAction } from '../actions/utils';
import { asIfNotOptimistic } from '../optimistic/selectors/select-is-optimistic';
import { reducerMap } from '../reducers';
import type { State, WorkerRootSagaOptions } from '../types';
import { SyncType, type SynchronizationResult, synchronize } from './workers/sync';

function* syncWorker(options: WorkerRootSagaOptions) {
    const state = (yield select()) as State;
    try {
        yield wait(1500);

        const sync: SynchronizationResult = yield call(
            synchronize,
            asIfNotOptimistic(state, reducerMap),
            SyncType.FULL,
            options
        );

        yield put(syncSuccess(sync));
    } catch (e: unknown) {
        yield put(syncFailure(e));
    } finally {
        logger.info('[Saga::Sync] Cancelling sync task');
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

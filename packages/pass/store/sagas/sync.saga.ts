import { call, put, select, takeLeading } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';

import { syncFailure, syncIntent, syncSuccess } from '../actions';
import { asIfNotOptimistic } from '../optimistic/selectors/select-is-optimistic';
import { reducerMap } from '../reducers';
import { State } from '../types';
import { SyncType, SynchronizationResult, synchronize } from './workers/sync';

function* syncWorker() {
    const state = (yield select()) as State;
    try {
        yield wait(1500);
        const sync: SynchronizationResult = yield call(
            synchronize,
            asIfNotOptimistic(state, reducerMap),
            SyncType.FULL
        );
        yield put(syncSuccess(sync));
    } catch (e: unknown) {
        yield put(syncFailure(e));
    }
}

export default function* watcher(): Generator {
    yield takeLeading(syncIntent.match, syncWorker);
}

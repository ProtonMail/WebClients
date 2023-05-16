import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { reportBug } from '@proton/shared/lib/api/reports';

import { reportProblemError, reportProblemIntent, reportProblemSuccess } from '../actions';
import type { WorkerRootSagaOptions } from '../types';

function* reportProblem(_: WorkerRootSagaOptions, { payload }: ReturnType<typeof reportProblemIntent>): Generator {
    try {
        yield api(reportBug(payload));
        yield put(reportProblemSuccess(payload, 'page'));
    } catch (error) {
        yield put(reportProblemError(payload, error, 'page'));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(reportProblemIntent.match, reportProblem, options);
}

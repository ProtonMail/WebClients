import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/api';
import { reportBug } from '@proton/shared/lib/api/reports';

import { reportProblemError, reportProblemIntent, reportProblemSuccess } from '../actions';
import type { WithSenderAction } from '../actions/with-receiver';
import type { WorkerRootSagaOptions } from '../types';

function* reportProblem(
    _: WorkerRootSagaOptions,
    { payload, meta }: WithSenderAction<ReturnType<typeof reportProblemIntent>>
): Generator {
    try {
        yield api(reportBug(payload));
        yield put(reportProblemSuccess(meta.sender?.endpoint));
    } catch (error) {
        yield put(reportProblemError(error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(reportProblemIntent.match, reportProblem, options);
}

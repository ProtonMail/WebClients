import { put, takeEvery } from 'redux-saga/effects';

import { api } from '@proton/pass/lib/api/api';
import { reportBugFailure, reportBugIntent, reportBugSuccess } from '@proton/pass/store/actions';
import type { WithSenderAction } from '@proton/pass/store/actions/with-receiver';
import type { WorkerRootSagaOptions } from '@proton/pass/store/types';
import { reportBug } from '@proton/shared/lib/api/reports';

function* reportProblem(
    _: WorkerRootSagaOptions,
    { payload, meta }: WithSenderAction<ReturnType<typeof reportBugIntent>>
): Generator {
    try {
        yield api(reportBug(payload));
        yield put(reportBugSuccess(meta.request.id, meta.sender?.endpoint));
    } catch (error) {
        yield put(reportBugFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: WorkerRootSagaOptions) {
    yield takeEvery(reportBugIntent.match, reportProblem, options);
}

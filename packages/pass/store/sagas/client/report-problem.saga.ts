import { put, takeEvery } from 'redux-saga/effects';

import { reportBug } from '@proton/shared/lib/api/reports';

import { api } from '../../../lib/api/api';
import { reportBugFailure, reportBugIntent, reportBugSuccess } from '../../actions';
import type { WithSenderAction } from '../../actions/enhancers/endpoint';
import type { RootSagaOptions } from '../../types';

function* reportProblem(_: RootSagaOptions, { payload, meta }: WithSenderAction<ReturnType<typeof reportBugIntent>>): Generator {
    try {
        yield api(reportBug(payload));
        yield put(reportBugSuccess(meta.request.id, meta.sender?.endpoint));
    } catch (error) {
        yield put(reportBugFailure(meta.request.id, error, meta.sender?.endpoint));
    }
}

export default function* watcher(options: RootSagaOptions) {
    yield takeEvery(reportBugIntent.match, reportProblem, options);
}

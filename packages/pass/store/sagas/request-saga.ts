import { put, takeEvery } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';

import { acknowledgeRequest } from '../actions';
import { isActionWithRequest } from '../actions/with-request';

/**
 * request data garbage collection : on a request success or failure,
 * if it not persistent, dispatch an acknowledgment action in order to
 * clear the request data for this particular request id.
 */
export default function* watcher() {
    yield takeEvery(isActionWithRequest, function* ({ meta: { request } }) {
        const { type, persistent, id } = request;
        if ((type === 'success' || type === 'failure') && !persistent) {
            yield wait(500);
            yield put(acknowledgeRequest(id));
        }
    });
}

import { put, takeEvery } from 'redux-saga/effects';

import { wait } from '@proton/shared/lib/helpers/promise';

import { invalidateRequest } from '../actions';
import { isActionWithRequest } from '../actions/with-request';

/**
 * request data garbage collection : on a request success or failure,
 * if it not persistent, dispatch an acknowledgment action in order to
 * clear the request data for this particular request id.
 */
export default function* watcher() {
    yield takeEvery(isActionWithRequest, function* ({ meta: { request } }) {
        if (request.type !== 'start' && !request.maxAge) {
            yield wait(500);
            yield put(invalidateRequest(request.id));
        }
    });
}

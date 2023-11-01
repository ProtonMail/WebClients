import { put, takeEvery } from 'redux-saga/effects';

import { requestInvalidate } from '@proton/pass/store/actions';
import { isActionWithRequest } from '@proton/pass/store/actions/with-request';
import { wait } from '@proton/shared/lib/helpers/promise';

/**
 * request data garbage collection : on a request success or failure,
 * if it not persistent, dispatch an acknowledgment action in order to
 * clear the request data for this particular request id.
 */
export default function* watcher() {
    yield takeEvery(isActionWithRequest, function* ({ meta: { request } }) {
        if (request.type !== 'start' && !request.maxAge) {
            yield wait(500);
            yield put(requestInvalidate(request.id));
        }
    });
}

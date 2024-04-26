import { call as callEffect, put, takeEvery } from 'redux-saga/effects';

import type { RequestFlow, RequestIntent, RequestSuccess } from './flow';

type RequestFlowSaga<T extends RequestFlow<any, any, void>> = {
    actions: T;
    call: (payload: RequestIntent<T>) => Promise<RequestSuccess<T>> | Generator<any, RequestSuccess<T>, any>;
};
/** The generated saga does not directly affect the application state. Instead,
 * it embraces the event sourcing pattern of Redux to handle API requests
 * without altering the state. Request metadata holds the response data.*/
export const createRequestSaga = <T extends RequestFlow<any, any, void>>({ actions, call }: RequestFlowSaga<T>) => {
    return function* () {
        function* worker(action: ReturnType<typeof actions.intent>) {
            const requestId = action.meta.request.id;
            const payload = action.payload as RequestIntent<T>;
            try {
                const data: RequestSuccess<T> = yield callEffect(call, payload);
                yield put(actions.success(requestId, data));
            } catch (error: unknown) {
                yield put(actions.failure(requestId, error));
            }
        }

        yield takeEvery(actions.intent.match, worker);
    };
};

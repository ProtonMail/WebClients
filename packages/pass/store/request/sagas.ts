import { call as callEffect, put, takeEvery } from 'redux-saga/effects';

import type { RootSagaOptions } from '@proton/pass/store/types';

import type { RequestFlow, RequestIntent, RequestSuccess } from './flow';

type RequestFlowSaga<T extends RequestFlow<any, any, void>, P extends any[] = []> = {
    actions: T;
    call: (
        payload: RequestIntent<T>,
        ...extraParams: P
    ) => Promise<RequestSuccess<T>> | Generator<any, RequestSuccess<T>, any>;
};
/** The generated saga does not directly affect the application state. Instead,
 * it embraces the event sourcing pattern of Redux to handle API requests
 * without altering the state. Request metadata holds the response data.*/
const createParametrizedRequestSaga = <T extends RequestFlow<any, any, void>, P extends any[] = []>({
    actions,
    call,
}: RequestFlowSaga<T, P>) => {
    return function* (...extraParams: P) {
        function* worker(action: ReturnType<typeof actions.intent>) {
            const requestId = action.meta.request.id;
            const payload = action.payload as RequestIntent<T>;
            try {
                const data: RequestSuccess<T> = yield callEffect(call, payload, ...extraParams);
                yield put(actions.success(requestId, data));
            } catch (error: unknown) {
                yield put(actions.failure(requestId, error));
            }
        }

        yield takeEvery(actions.intent.match, worker);
    };
};

export const createRequestSaga = <T extends RequestFlow<any, any, void>>(
    options: RequestFlowSaga<T, [RootSagaOptions]>
) => createParametrizedRequestSaga<T, [RootSagaOptions]>(options);

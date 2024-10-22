import type { Action } from 'redux';
import { call as callEffect, put, takeEvery } from 'redux-saga/effects';

import { isActionWithSender, withSender } from '@proton/pass/store/actions/enhancers/endpoint';
import type { RootSagaOptions } from '@proton/pass/store/types';
import identity from '@proton/utils/identity';

import type { RequestFlow, RequestIntent, RequestSuccess } from './flow';

type RequestFlowSaga<T extends RequestFlow<any, any, void>, P extends any[] = []> = {
    actions: T;
    call: (
        payload: RequestIntent<T>,
        ...extraParams: P
    ) => RequestSuccess<T> | Promise<RequestSuccess<T>> | Generator<any, RequestSuccess<T>, any>;
    enhance?: <A extends Action>(resultAction: A, intent: ReturnType<T['intent']>) => A;
};
/** The generated saga does not directly affect the application state. Instead,
 * it embraces the event sourcing pattern of Redux to handle API requests
 * without altering the state. Request metadata holds the response data.*/
const createParametrizedRequestSaga = <T extends RequestFlow<any, any, void>, P extends any[] = []>({
    actions,
    call,
    enhance,
}: RequestFlowSaga<T, P>) => {
    return function* (...extraParams: P) {
        function* worker(intent: ReturnType<typeof actions.intent>) {
            const requestId = intent.meta.request.id;
            const payload = intent.payload as RequestIntent<T>;
            const enhancer = enhance ?? identity;
            try {
                const data: RequestSuccess<T> = yield callEffect(call, payload, ...extraParams);
                yield put(enhancer(actions.success(requestId, data), intent as ReturnType<T['intent']>));
            } catch (error: unknown) {
                yield put(enhancer(actions.failure(requestId, error), intent as ReturnType<T['intent']>));
            }
        }

        yield takeEvery(actions.intent.match, worker);
    };
};

export const createRequestSaga = <T extends RequestFlow<any, any, void>>(
    options: RequestFlowSaga<T, [RootSagaOptions]>
) =>
    createParametrizedRequestSaga<T, [RootSagaOptions]>({
        ...options,
        enhance: (action, intent) => {
            /** Enhance the result actions with the sender metadata.
             * This is only used for the extension when we may want
             * to process actions for a specific endpoint */
            const sender = isActionWithSender(intent) ? intent.meta.sender : null;
            return sender ? withSender(sender)(action) : action;
        },
    });

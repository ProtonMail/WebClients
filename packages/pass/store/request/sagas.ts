import type { Action } from 'redux';
import { call as callEffect, put, race, take, takeEvery } from 'redux-saga/effects';

import { isActionWithSender, withSender } from '@proton/pass/store/actions/enhancers/endpoint';
import { matchCancel } from '@proton/pass/store/request/actions';
import type { RootSagaOptions } from '@proton/pass/store/types';
import identity from '@proton/utils/identity';

import type { RequestFailure, RequestFlow, RequestIntent, RequestSuccess } from './flow';

type RequestFlowSaga<T extends RequestFlow<any, any, any>, P extends any[] = []> = {
    actions: RequestFailure<T> extends RequestIntent<T>
        ? T
        : `RequestFlowSaga constraint violation: Failure type must extend Intent type`;
    call: (
        payload: RequestIntent<T>,
        ...extraParams: P
    ) => RequestSuccess<T> | Promise<RequestSuccess<T>> | Generator<any, RequestSuccess<T>, any>;
    enhance?: <A extends Action>(resultAction: A, intent: ReturnType<T['intent']>) => A;
};

export function* cancelRequest(requestId: string) {
    yield take(matchCancel(requestId));
    throw new DOMException(`${requestId} aborted`, 'AbortError');
}

/** The generated saga does not directly affect the application state. Instead,
 * it embraces the event sourcing pattern of Redux to handle API requests
 * without altering the state. Request metadata holds the response data.*/
const createParametrizedRequestSaga = <T extends RequestFlow<any, any, any>, P extends any[] = []>(
    flow: RequestFlowSaga<T, P>
) => {
    return function* (...extraParams: P) {
        const actions = flow.actions as T;
        const { enhance, call } = flow;
        function* worker(intent: ReturnType<T['intent']>) {
            const requestId = intent.meta.request.id;
            const payload = intent.payload as RequestIntent<T>;
            const enhancer = enhance ?? identity;
            try {
                const result: { data: RequestSuccess<T> } = yield race({
                    data: callEffect(call, payload, ...extraParams),
                    cancel: callEffect(cancelRequest, requestId),
                });

                yield put(enhancer(actions.success(requestId, result.data), intent));
            } catch (error: unknown) {
                yield put(enhancer(actions.failure(requestId, error, intent), intent));
            }
        }

        yield takeEvery(actions.intent.match, worker);
    };
};

export const createRequestSaga = <T extends RequestFlow<any, any, any>>(
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

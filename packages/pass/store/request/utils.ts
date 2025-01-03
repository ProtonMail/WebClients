import type { Action, Dispatch } from 'redux';

import { withAsyncRequest } from '@proton/pass/store/request/enhancers';
import type { RequestFlow } from '@proton/pass/store/request/flow';

import type { RequestAsyncResult, RequestType, WithRequest } from './types';

export const isActionWithRequest = <T extends Action>(action?: T): action is WithRequest<T, RequestType, unknown> =>
    (action as any)?.meta?.request !== undefined;

export const asyncRequestDispatcherFactory =
    (dispatch: Dispatch) =>
    <T extends RequestFlow<any, any, any>>(flow: T, ...args: Parameters<T['intent']>) =>
        dispatch(withAsyncRequest(flow.intent.apply(null, args))) as unknown as Promise<
            RequestAsyncResult<ReturnType<T['success']>, ReturnType<T['failure']>>
        >;

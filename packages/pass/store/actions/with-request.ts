import { type PrepareAction } from '@reduxjs/toolkit';
import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object/merge';

export type RequestType = 'start' | 'failure' | 'success';

export type RequestOptions<T extends RequestType = RequestType> = Extract<
    | { type: 'start'; id: string; revalidate?: boolean }
    | { type: 'success'; id: string; maxAge?: number }
    | { type: 'failure'; id: string; maxAge?: number },
    { type: T }
>;

export type RequestProgress<T> =
    | { type: 'progress'; value: number }
    | { type: 'done'; result: T }
    | { type: 'error'; error: unknown };

export type WithRequest<A extends object, T extends RequestType> = A & {
    meta: { request: RequestOptions<T> };
};

export const isActionWithRequest = <T extends AnyAction>(action?: T): action is WithRequest<T, RequestType> =>
    (action as any)?.meta?.request !== undefined;

const withRequest =
    <T extends RequestType>(request: RequestOptions<T>) =>
    <A extends object>(action: A): WithRequest<A, T> =>
        merge(action, { meta: { request } });

const withRequestStatus =
    <T extends RequestType>(type: T) =>
    <PA extends PrepareAction<any>>(
        prepare: PA,
        options?: T extends 'success' | 'failure' ? { maxAge: number } : never
    ) =>
    <V extends string>(requestId: V, ...args: Parameters<PA>) =>
        withRequest(
            ((): RequestOptions => {
                switch (type) {
                    case 'start':
                        return { type, id: requestId };
                    default:
                        return { type, id: requestId, maxAge: options?.maxAge };
                }
            })()
        )(prepare(...args) as ReturnType<PA>) as WithRequest<ReturnType<PA>, T>;

export const withRequestStart = withRequestStatus('start');
export const withRequestFailure = withRequestStatus('failure');
export const withRequestSuccess = withRequestStatus('success');

export const withRevalidate = <T extends WithRequest<AnyAction, 'start'>>(action: T) => {
    action.meta.request.revalidate = true;
    return action;
};

export default withRequest;

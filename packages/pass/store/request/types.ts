import type { PayloadAction } from '@reduxjs/toolkit';
import type { Action } from 'redux';

import type { WithMeta } from '@proton/pass/store/actions/enhancers/meta';
import type { IsNever } from '@proton/pass/types';

export type RequestState = Record<string, RequestEntry>;

export type RequestType = 'start' | 'failure' | 'success' | 'progress';
export type RequestStatus = Exclude<RequestType, 'progress'>;
export type RequestMeta<T extends RequestType, D extends unknown = never> = { request: RequestMetadata<T, D> };
export type WithRequest<A extends object, T extends RequestType, D extends unknown = never> = WithMeta<
    RequestMeta<T, D>,
    A
>;

/** `RequestMetadata` is designed for proper type inference when using
 * request action enhancers. The `Data` type defaults to `undefined` to
 * avoid requiring `data` when using the request action enhancers */
export type RequestMetadata<T extends RequestType = RequestType, D extends unknown = never> = Extract<
    | ({ status: 'start' } & RequestConfig<'start', D>)
    | ({ status: 'failure' } & RequestConfig<'failure', D>)
    | ({ status: 'progress' } & RequestConfig<'progress', D>)
    | ({ status: 'success' } & RequestConfig<'success', D>),
    { status: T }
> & { id: string; async?: boolean };

export type RequestConfig<T extends RequestType, D extends unknown = never> = {
    start: {
        /** If `true`, bypasses cache and forces a fresh
         * request even if valid cached data exists */
        revalidate?: boolean;
        /** Optional data to store during the request lifecycle.
         * Available in reducer state. */
        data?: D;
    };
    success: {
        /** Duration in seconds to cache the successful response.
         * If set, subsequent requests within this timeframe will
         * return cached data unless revalidated */
        maxAge?: number;
        /** Response data to cache if `maxAge` is set.
         * If not explicitly set, falls back to `action.payload` */
        data?: D;
    };
    failure: {};
    progress: { progress: number };
}[T];

export type RequestEntry<T extends RequestStatus = RequestStatus, D = any> = {
    start: { status: 'start'; progress: number; data?: D };
    success: { status: 'success'; maxAge?: number; requestedAt: number; data?: D };
    failure: { status: 'failure' };
}[T];

/** Request progress union type when tracking progress events */
export type RequestProgress<T, D = T> =
    | { type: 'progress'; progress: number; data: D }
    | { type: 'done'; result: T }
    | { type: 'error'; error: unknown };

export type ActionRequestEntry<T extends Action> =
    T extends WithRequest<{ payload: infer P }, infer U, infer D>
        ? U extends RequestStatus
            ? RequestEntry<U, D extends true ? P : undefined>
            : never
        : never;

/** Controls the return value when a request succeeds:
 * - If request config has an explicit `data` field, returns that value
 * - Otherwise defaults to returning the action's `payload` */
export type RequestSuccessDTO<T extends WithRequest<any, any, any>> =
    T extends WithRequest<PayloadAction<unknown>, 'success', infer U>
        ? IsNever<U> extends true
            ? T['payload']
            : U
        : never;

export type RequestAsyncResult<TSuccess extends PayloadAction = any, TFailure extends PayloadAction = any> =
    | { type: 'success'; data: RequestSuccessDTO<TSuccess> }
    | { type: 'failure'; error: 'error' extends keyof TFailure ? TFailure['error'] : undefined };

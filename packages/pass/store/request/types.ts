import type { Action } from 'redux';

import type { WithMeta } from '@proton/pass/store/actions/enhancers/meta';

export type RequestState = Record<string, RequestEntry>;

export type RequestType = 'start' | 'failure' | 'success' | 'progress';
export type RequestStatus = Exclude<RequestType, 'progress'>;
export type RequestMeta<T extends RequestType, D extends boolean = false> = { request: RequestMetadata<T, D> };
export type WithRequest<A extends object, T extends RequestType, D extends boolean> = WithMeta<RequestMeta<T, D>, A>;

/** `RequestMetadata` is designed for proper type inference when using
 * request action enhancers. The `Data` type defaults to `undefined` to
 * avoid requiring `data` when using the request action enhancers */
export type RequestMetadata<T extends RequestType = RequestType, D extends boolean = false> = Extract<
    | ({ status: 'start' } & RequestConfig<'start', D>)
    | ({ status: 'failure' } & RequestConfig<'failure', D>)
    | ({ status: 'progress' } & RequestConfig<'progress', D>)
    | ({ status: 'success' } & RequestConfig<'success', D>),
    { status: T }
> & { id: string };

export type RequestConfig<T extends RequestType, D extends boolean = false> = {
    start: { revalidate?: boolean };
    success: { maxAge?: number };
    failure: {};
    progress: { progress: number };
}[T] & { data?: D };

export type RequestEntry<T extends RequestStatus = RequestStatus, D = any> = {
    start: { status: 'start'; progress: number };
    success: { status: 'success'; maxAge?: number; requestedAt: number };
    failure: { status: 'failure' };
}[T] & { data: D };

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

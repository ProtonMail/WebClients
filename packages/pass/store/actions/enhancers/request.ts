import { type PrepareAction } from '@reduxjs/toolkit';
import type { Action } from 'redux';

import { type WithMeta, withMetaFactory } from './meta';

export type RequestType = 'start' | 'failure' | 'success' | 'progress';

/** Optionally adds the extra data property on the `RequestOptions` */
export type WithOptionalData<Req, Data> = Req & (Data extends undefined ? {} : { data: Data });

/** `RequestOptions` is designed for proper type inference when using
 * request action enhancers. The `Data` type defaults to `undefined` to
 * avoid requiring `data` when using the request action enhancers */
export type RequestOptions<Type extends RequestType = RequestType, Data = undefined> = WithOptionalData<
    Extract<
        | { type: 'start'; id: string; revalidate?: boolean }
        | { type: 'success'; id: string; maxAge?: number }
        | { type: 'failure'; id: string; maxAge?: number }
        | { type: 'progress'; id: string; progress?: number },
        { type: Type }
    >,
    Data
>;

/** Request progress union type when tracking progress events */
export type RequestProgress<T, D = T> =
    | { type: 'progress'; progress: number; data: D }
    | { type: 'done'; result: T }
    | { type: 'error'; error: unknown };

export type WithRequest<A extends object, Type extends RequestType, Data = undefined> = WithMeta<
    { request: RequestOptions<Type, Data> },
    A
>;

export const withRequest = <Type extends RequestType, Data = undefined>(request: RequestOptions<Type, Data>) =>
    withMetaFactory<{ request: RequestOptions<Type, Data> }>({ request });

const withRequestResult =
    <Type extends 'success' | 'failure'>(type: Type) =>
    <PA extends PrepareAction<any>, Data>(
        prepare: PA,
        config?: { maxAge?: number; data?: (...args: Parameters<PA>) => Data }
    ) =>
    <ID extends string>(requestId: ID, ...args: Parameters<PA>) =>
        withRequest<'success' | 'failure', Data>({
            id: requestId,
            type,
            maxAge: config?.maxAge,
            data: config?.data?.(...args),
        })(prepare(...args) as ReturnType<PA>) as WithRequest<ReturnType<PA>, Type, Data>;

export const withRequestFailure = withRequestResult('failure');
export const withRequestSuccess = withRequestResult('success');

export const withRequestProgress =
    <PA extends PrepareAction<any>>(prepare: PA) =>
    <ID extends string>(requestId: ID, progress: number, ...args: Parameters<PA>) =>
        withRequest<'progress'>({ id: requestId, type: 'progress', progress })(
            prepare(...args) as ReturnType<PA>
        ) as WithRequest<ReturnType<PA>, 'progress', undefined>;

export const withRevalidate = <T extends WithRequest<Action, 'start'>>(action: T) => {
    action.meta.request.revalidate = true;
    return action;
};

export const isActionWithRequest = <T extends Action>(action?: T): action is WithRequest<T, RequestType> =>
    (action as any)?.meta?.request !== undefined;

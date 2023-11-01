import { type PrepareAction } from '@reduxjs/toolkit';
import type { AnyAction } from 'redux';

import { merge } from '@proton/pass/utils/object/merge';

export type RequestType = 'start' | 'failure' | 'success';
/* optionally adds the extra data property on the `RequestOptions` */
export type WithOptionalData<Req, Data> = Req & (Data extends undefined ? {} : { data: Data });

/* For proper inference when creating action creators, `Data` type defaults to `undefined`
 * in order to avoid having to define the `data` in the request options when not used. */
export type RequestOptions<Type extends RequestType = RequestType, Data = undefined> = WithOptionalData<
    Extract<
        | { type: 'start'; id: string; revalidate?: boolean }
        | { type: 'success'; id: string; maxAge?: number }
        | { type: 'failure'; id: string; maxAge?: number },
        { type: Type }
    >,
    Data
>;

/* request progress union type when tracking progress */
export type RequestProgress<T> =
    | { type: 'progress'; value: number }
    | { type: 'done'; result: T }
    | { type: 'error'; error: unknown };

export type WithRequest<Action extends object, Type extends RequestType, Data = undefined> = Action & {
    meta: { request: RequestOptions<Type, Data> };
};

export const isActionWithRequest = <Action extends AnyAction>(
    action?: Action
): action is WithRequest<Action, RequestType> => (action as any)?.meta?.request !== undefined;

const withRequest =
    <Type extends RequestType, Data = undefined>(request: RequestOptions<Type, Data>) =>
    <Action extends object>(action: Action): WithRequest<Action, Type, Data> =>
        merge(action, { meta: { request } });

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

export const withRevalidate = <Action extends WithRequest<AnyAction, 'start'>>(action: Action) => {
    action.meta.request.revalidate = true;
    return action;
};

export default withRequest;

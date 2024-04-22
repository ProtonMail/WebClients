import { type PrepareAction } from '@reduxjs/toolkit';
import type { Action } from 'redux';

import { withMetaFactory } from '@proton/pass/store/actions/enhancers/meta';

import type { RequestConfig, RequestMeta, RequestMetadata, RequestType, WithRequest } from './types';

export const withRequest = <T extends RequestType, D extends boolean = false>(request: RequestMetadata<T, D>) =>
    withMetaFactory<RequestMeta<T, D>>({ request });

export const withRequestSuccess =
    <PA extends PrepareAction<any>, D extends boolean = false>(prepare: PA, config?: RequestConfig<'success', D>) =>
    (id: string, ...args: Parameters<PA>) =>
        withRequest<'success', D>({ id, status: 'success', ...(config ?? { data: false as D }) })(
            prepare(...args) as ReturnType<PA>
        );

export const withRequestFailure =
    <PA extends PrepareAction<any>, D extends boolean = false>(prepare: PA, config?: RequestConfig<'failure', D>) =>
    (id: string, ...args: Parameters<PA>) =>
        withRequest<'failure', D>({ id, status: 'failure', ...(config ?? { data: false as D }) })(
            prepare(...args) as ReturnType<PA>
        );

export const withRequestProgress =
    <PA extends PrepareAction<any>>(prepare: PA) =>
    (id: string, progress: number, ...args: Parameters<PA>) =>
        withRequest<'progress', false>({ id, status: 'progress', progress, data: false })(
            prepare(...args) as ReturnType<PA>
        );

/** Adds revalidation metadata on the action. This allows
 * by-passing the `maxAge` check when dispatching an action
 * in order to force starting a new request */
export const withRevalidate = <T extends WithRequest<Action, 'start', boolean>>(action: T) => {
    action.meta.request.revalidate = true;
    return action;
};

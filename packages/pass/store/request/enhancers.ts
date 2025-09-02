import type { PrepareAction } from '@reduxjs/toolkit';
import type { Action } from 'redux';

import { withMetaFactory } from '@proton/pass/store/actions/enhancers/meta';

import type { RequestConfig, RequestMeta, RequestMetadata, RequestType, WithRequest } from './types';

export const withRequest = <T extends RequestType, D extends any = never>(request: RequestMetadata<T, D>) =>
    withMetaFactory<RequestMeta<T, D>>({ request });

export const withRequestSuccess =
    <PA extends PrepareAction<any>, D extends any = never>(prepare: PA, config: RequestConfig<'success', D> = {}) =>
    (id: string, ...args: Parameters<PA>) =>
        withRequest<'success', D>({ id, status: 'success', ...config })(prepare(...args) as ReturnType<PA>);

export const withRequestFailure =
    <PA extends PrepareAction<any>, D extends any = never>(prepare: PA, config: RequestConfig<'failure', D> = {}) =>
    (id: string, ...args: Parameters<PA>) =>
        withRequest<'failure', D>({ id, status: 'failure', ...config })(prepare(...args) as ReturnType<PA>);

export const withRequestProgress =
    <PA extends PrepareAction<any>>(prepare: PA) =>
    (id: string, progress: number, ...args: Parameters<PA>) =>
        withRequest<'progress', never>({ id, status: 'progress', progress })(prepare(...args) as ReturnType<PA>);

/** Adds revalidation metadata on the action. This allows
 * by-passing the `maxAge` check when dispatching an action
 * in order to force starting a new request */
export const withRevalidate = <T extends WithRequest<Action, 'start', any>>(action: T) => {
    action.meta.request.revalidate = true;
    return action;
};

export const withAsyncRequest = <T extends WithRequest<Action, 'start', any>>(action: T) => {
    action.meta.request.async = true;
    return action;
};

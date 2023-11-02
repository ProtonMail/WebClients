import type { Subscriber } from '@proton/pass/utils/pubsub/factory';

import type { Maybe } from '../utils';
import type { ApiResponse } from './pass';

export type ApiCallFn = (options: ApiOptions) => Promise<Response>;

export type ApiAuth = {
    UID: string;
    AccessToken: string;
    RefreshToken: string;
    RefreshTime?: number;
};

export type ApiState = {
    serverTime?: Date;
    offline: boolean;
    unreachable: boolean;
    appVersionBad: boolean;
    sessionInactive: boolean;
    sessionLocked: boolean;
};

/**
 * This generic Api type lets us :
 * - Infer the Api response type from the auto-generated swagger
 *   types by only looking at the options's method and url
 * - Hard-cast the response type when dealing with API urls
 *   that have not been auto-generated (legacy support)
 */
export type Api = {
    <T extends any = void, U extends string = string, M extends string = string>(
        config: ApiOptions<U, M>
    ): Promise<ApiResult<T, U, M>>;
    getState: () => ApiState;
    reset: () => void;
    subscribe: (subscribe: Subscriber<ApiSubscribtionEvent>) => () => void;
    unsubscribe: () => void;
};

export type ApiOptions<U extends string = string, M extends string = string> = {
    [option: string]: any;
} & {
    headers?: { [key: string]: string };
    method?: M;
    output?: 'json' | 'raw' | 'stream';
    params?: { [key: string]: any };
    silent?: boolean;
    url?: U;
};

export type ApiResult<T extends any = void, U extends string = string, M extends string = string> = T extends void
    ? ApiResponse<`${U}`, `${M}`>
    : T;

export type ApiResponseMapper<T extends any = void, U extends string = string, M extends string = string> = Maybe<
    (response: T extends void ? ApiResponse<`${U}`, `${M}`> : T) => any
>;

export type ApiSubscribtionEvent =
    | { type: 'session'; status: 'inactive' | 'locked' }
    | { type: 'error'; error: string };

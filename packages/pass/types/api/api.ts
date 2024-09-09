import type { RefreshSessionData } from '@proton/pass/lib/api/refresh';
import type { Awaiter } from '@proton/pass/utils/fp/promises';
import type { Subscriber } from '@proton/pass/utils/pubsub/factory';

import type { Maybe } from '../utils';
import type { ApiResponse } from './pass';

export type ApiCallFn = (options: ApiOptions) => Promise<Response>;

export enum AuthMode {
    TOKEN,
    COOKIE,
}

export type ApiAuth =
    | { type: AuthMode.TOKEN; UID: string; AccessToken: string; RefreshToken: string; RefreshTime?: number }
    | { type: AuthMode.COOKIE; UID: string; RefreshTime?: number };

export type ApiState = {
    appVersionBad: boolean;
    online: boolean;
    pendingCount: number;
    queued: Awaiter<void>[];
    refreshing: boolean;
    serverTime?: Date;
    sessionInactive: boolean;
    sessionLocked: boolean;
    unreachable: boolean;
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
    idle: () => Promise<void>;
    reset: () => Promise<void>;
    subscribe: (subscribe: Subscriber<ApiSubscriptionEvent>) => () => void;
    unsubscribe: () => void;
};

export type ApiOptions<U extends string = string, M extends string = string> = {
    [option: string]: any;
} & {
    auth?: ApiAuth;
    headers?: { [key: string]: string };
    method?: M;
    output?: 'json' | 'raw' | 'stream';
    params?: { [key: string]: any };
    sideEffects?: boolean;
    signal?: AbortSignal;
    silence?: boolean | (string | number)[];
    unauthenticated?: boolean;
    url?: U;
};

export type ApiResult<T extends any = void, U extends string = string, M extends string = string> = T extends void
    ? ApiResponse<`${U}`, `${M}`>
    : T;

export type ApiResponseMapper<T extends any = void, U extends string = string, M extends string = string> = Maybe<
    (response: T extends void ? ApiResponse<`${U}`, `${M}`> : T) => any
>;

export type ApiSessionEvent = 'inactive' | 'locked' | 'not-allowed' | 'missing-scope';

export type ApiSubscriptionEvent =
    | { type: 'error'; error: string; silent?: boolean }
    | { type: 'network'; online: boolean }
    | { type: 'refresh'; data: RefreshSessionData }
    | { type: 'session'; status: ApiSessionEvent; error?: string; silent?: boolean };

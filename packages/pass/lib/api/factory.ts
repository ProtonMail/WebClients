import { updateServerTime } from '@proton/crypto/lib/serverTime';
import { authStore } from '@proton/pass/lib/auth/store';
import type {
    Api,
    ApiAuth,
    ApiCallFn,
    ApiOptions,
    ApiResult,
    ApiState,
    ApiSubscriptionEvent,
    Maybe,
} from '@proton/pass/types';
import { AuthMode } from '@proton/pass/types';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
import { objectHandler } from '@proton/pass/utils/object/handler';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import configureApi from '@proton/shared/lib/api';
import {
    getApiError,
    getApiErrorMessage,
    getIsOfflineError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { DEFAULT_TIMEOUT } from '@proton/shared/lib/constants';
import xhr from '@proton/shared/lib/fetch/fetch';
import { withLocaleHeaders } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { localeCode } from '@proton/shared/lib/i18n';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';
import noop from '@proton/utils/noop';

import { PassErrorCode, isAbortError } from './errors';
import { withApiHandlers } from './handlers';
import { refreshHandlerFactory } from './refresh';
import { getSilenced, isAccessRestricted } from './utils';

export type ApiFactoryOptions = {
    config: ProtonConfig;
    /** Specifies the maximum number of concurrent requests. If not provided,
     * all requests will be processed immediately. When a value is set, ongoing
     * requests will be deferred until the threshold is ready for additional processing. */
    threshold?: number;
    getAuth?: () => Maybe<ApiAuth>;
};

/** Provides dynamic API auth options based on the current session state.
 * Supports upgrading from token-based to cookie-based authentication.
 * This is crucial for scenarios where token-based auth is required
 * before transitioning to cookies, enabling seamless auth upgrades. */
export const getDynamicAuth = (): Maybe<ApiAuth> => {
    const { cookies, UID, AccessToken, RefreshToken, RefreshTime } = authStore.getSession();
    if (!UID) return undefined;

    if (cookies) return { type: AuthMode.COOKIE, UID, RefreshTime };
    if (AccessToken && RefreshToken) return { type: AuthMode.TOKEN, UID, AccessToken, RefreshToken, RefreshTime };
};

export const createApi = ({ config, getAuth = getDynamicAuth, threshold }: ApiFactoryOptions): Api => {
    const pubsub = createPubSub<ApiSubscriptionEvent>();
    const clientID = getClientID(config.APP_NAME);

    const state = objectHandler<ApiState>({
        appVersionBad: false,
        online: true,
        pendingCount: 0,
        queued: [],
        refreshing: false,
        serverTime: undefined,
        sessionInactive: false,
        sessionLocked: false,
        unreachable: false,
    });

    const call = configureApi({ ...config, clientID, xhr } as any) as ApiCallFn;

    const refreshHandler = refreshHandlerFactory({
        call,
        getAuth,
        onRefresh: (data) => pubsub.publishAsync({ type: 'refresh', data }),
    });

    const apiCall = withApiHandlers({ call, getAuth, refreshHandler, state });

    const api = async (options: ApiOptions): Promise<ApiResult> => {
        const pending = state.get('pendingCount') + 1;
        state.set('pendingCount', pending);

        if (threshold && pending > threshold) {
            const trigger = awaiter<void>();
            state.get('queued').push(trigger);
            await trigger;
        }

        /** According to the API specification : no requests
         * should be made if a refresh is ongoing */
        await waitUntil(() => !state.get('refreshing'), 250, DEFAULT_TIMEOUT);

        const { output = 'json', sideEffects = true, ...rest } = options;
        const config = getAuth() ? rest : withLocaleHeaders(localeCode, rest);

        return apiCall(config)
            .then((response) => {
                const latestServerTime = state.get('serverTime')?.getTime() ?? 0;
                const serverTime = getDateHeader(response.headers);

                /* The HTTP Date header is mandatory, so this should never
                 * occur. We need the server time for proper time sync: falling
                 * back to the local time can result in e.g. unverifiable signatures */
                if (!serverTime) throw new Error('Could not fetch server time');

                /** If the server time isn't greater than the last seen
                 * server time value - then we may be dealing with a cached
                 * response. In such cases, avoid mutating API state */
                if (sideEffects && serverTime.getTime() >= latestServerTime) {
                    const broadcast = !state.get('online') || state.get('unreachable');
                    state.set('serverTime', updateServerTime(serverTime));
                    state.set('unreachable', false);
                    state.set('online', true);

                    if (broadcast) pubsub.publish({ type: 'connectivity', online: true, unreachable: false });
                }

                return Promise.resolve(
                    (() => {
                        switch (output) {
                            case 'stream':
                                return response.body;
                            case 'raw':
                                return response;
                            default:
                                return response[output]();
                        }
                    })()
                );
            })
            .catch((e: any) => {
                if (!sideEffects || isAbortError(e)) throw e;

                const serverTime = e.response?.headers ? getDateHeader(e.response.headers) : undefined;
                const { code } = getApiError(e);
                const error = getApiErrorMessage(e);
                const silent = getSilenced(options, code);

                const networkError = code === PassErrorCode.SERVICE_NETWORK_ERROR;
                const missingScope = code === PassErrorCode.MISSING_SCOPE;
                const restricted = isAccessRestricted(code, options.url);
                const online = !(getIsOfflineError(e) || networkError);
                const unreachable = getIsUnreachableError(e);
                const sessionLocked = e.name === 'LockedSession';
                const sessionInactive = e.name === 'InactiveSession' || code === PassErrorCode.SRP_ERROR;
                const broadcast = state.get('online') !== online || state.get('unreachable') !== unreachable;

                if (serverTime) state.set('serverTime', updateServerTime(serverTime));
                state.set('appVersionBad', e.name === 'AppVersionBadError');
                state.set('sessionInactive', sessionInactive);
                state.set('sessionLocked', sessionLocked);
                state.set('unreachable', unreachable);
                state.set('online', online);

                if (broadcast) pubsub.publish({ type: 'connectivity', online, unreachable });
                if (sessionLocked) pubsub.publish({ type: 'session', status: 'locked' });
                if (sessionInactive) pubsub.publish({ type: 'session', status: 'inactive', silent });
                if (restricted) pubsub.publish({ type: 'session', status: 'restricted', error });
                if (missingScope) pubsub.publish({ type: 'session', status: 'missing-scope' });
                if (error) pubsub.publish({ type: 'error', error, silent });

                throw e;
            })
            .finally(() => {
                state.set('pendingCount', state.get('pendingCount') - 1);
                state.get('queued').shift()?.resolve();
            });
    };

    api.getState = () => state.data;

    api.idle = async () => {
        /* if API has pending requests - wait for API to be completely idle before
         * resetting state - this allows propagating API error state correctly.
         * For instance, on an inactive session, we want to avoid resetting the state
         * before every ongoing request has terminated (possible retries or refreshes) */
        if (state.get('pendingCount') > 0) {
            logger.info(`[API] Reset deferred until API idle`);
            await waitUntil(() => api.getState().pendingCount === 0, 50, DEFAULT_TIMEOUT).catch(noop);
        }
    };

    api.reset = async () => {
        await api.idle();

        state.set('pendingCount', 0);
        state.set('queued', []);
        state.set('serverTime', undefined);
        state.set('appVersionBad', false);
        state.set('sessionInactive', false);
        state.set('sessionLocked', false);

        logger.info(`[API] internal api state reset`);
    };

    api.subscribe = pubsub.subscribe;
    api.unsubscribe = pubsub.unsubscribe;

    return api as Api;
};

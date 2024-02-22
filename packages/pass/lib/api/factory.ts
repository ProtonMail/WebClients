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
import { awaiter } from '@proton/pass/utils/fp/promises';
import { waitUntil } from '@proton/pass/utils/fp/wait-until';
import { logger } from '@proton/pass/utils/logger';
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

import { withApiHandlers } from './handlers';
import { createRefreshHandler } from './refresh';
import { getSilenced } from './utils';

export type ApiFactoryOptions = {
    config: ProtonConfig;
    /** Specifies the maximum number of concurrent requests. If not provided,
     * all requests will be processed immediately. When a value is set, ongoing
     * requests will be deferred until the threshold is ready for additional processing. */
    threshold?: number;
    getAuth?: () => Maybe<ApiAuth>;
};

export const getAPIAuth = () => {
    const AccessToken = authStore.getAccessToken();
    const RefreshToken = authStore.getRefreshToken();
    const RefreshTime = authStore.getRefreshTime();
    const UID = authStore.getUID();
    if (!(UID && AccessToken && RefreshToken)) return undefined;
    return { UID, AccessToken, RefreshToken, RefreshTime };
};

export const createApi = ({ config, getAuth = getAPIAuth, threshold }: ApiFactoryOptions): Api => {
    const pubsub = createPubSub<ApiSubscriptionEvent>();
    const clientID = getClientID(config.APP_NAME);

    const state: ApiState = {
        appVersionBad: false,
        offline: false,
        pendingCount: 0,
        queued: [],
        serverTime: undefined,
        sessionInactive: false,
        sessionLocked: false,
        unreachable: false,
    };

    const call = configureApi({ ...config, clientID, xhr } as any) as ApiCallFn;

    const refreshHandler = createRefreshHandler({
        call,
        getAuth,
        onRefresh: (data) => pubsub.publishAsync({ type: 'refresh', data }),
    });
    const apiCall = withApiHandlers({ call, getAuth, refreshHandler, state });

    const api = async (options: ApiOptions): Promise<ApiResult> => {
        state.pendingCount += 1;

        if (threshold && state.pendingCount > threshold) {
            const trigger = awaiter<void>();
            state.queued.push(trigger);
            await trigger;
        }

        const { output = 'json', ...rest } = options;
        const config = getAuth() ? rest : withLocaleHeaders(localeCode, rest);
        const offline = state.offline;

        return apiCall(config)
            .then((response) => {
                /* The HTTP Date header is mandatory, so this should never
                 * occur. We need the server time for proper time sync: falling
                 * back to the local time can result in e.g. unverifiable signatures  */
                const serverTime = getDateHeader(response.headers);
                if (!serverTime) throw new Error('Could not fetch server time');

                state.offline = false;
                state.serverTime = updateServerTime(serverTime);
                state.unreachable = false;

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
                const serverTime = e.response?.headers ? getDateHeader(e.response.headers) : undefined;
                const { code } = getApiError(e);
                const error = getApiErrorMessage(e);
                const isOffline = getIsOfflineError(e);
                const isUnreachable = getIsUnreachableError(e);

                state.appVersionBad = e.name === 'AppVersionBadError';
                state.offline = isOffline;
                state.serverTime = serverTime ? updateServerTime(serverTime) : state.serverTime;
                state.sessionInactive = e.name === 'InactiveSession';
                state.sessionLocked = e.name === 'LockedSession';
                state.unreachable = isUnreachable;

                if (state.sessionLocked) pubsub.publish({ type: 'session', status: 'locked' });
                if (state.sessionInactive) pubsub.publish({ type: 'session', status: 'inactive' });
                if (error && !getSilenced(e.config, code)) pubsub.publish({ type: 'error', error });

                throw e;
            })
            .finally(() => {
                state.pendingCount -= 1;
                state.queued.shift()?.resolve();
                if (state.offline !== offline) pubsub.publish({ type: 'network', online: !state.offline });
            });
    };

    api.getState = () => state;

    api.idle = async () => {
        /* if API has pending requests - wait for API to be completely idle before
         * resetting state - this allows propagating API error state correctly.
         * For instance, on an inactive session, we want to avoid resetting the state
         * before every ongoing request has terminated (possible retries or refreshes) */
        if (api.getState().pendingCount > 0) {
            logger.info(`[API] Reset deferred until API idle`);
            await waitUntil(() => api.getState().pendingCount === 0, 50, DEFAULT_TIMEOUT).catch(noop);
        }
    };

    api.reset = async () => {
        await api.idle();

        state.pendingCount = 0;
        state.queued = [];
        state.serverTime = undefined;
        state.appVersionBad = false;
        state.offline = false;
        state.unreachable = false;
        state.sessionInactive = false;
        state.sessionLocked = false;

        logger.info(`[API] internal api state reset`);
    };

    api.subscribe = pubsub.subscribe;
    api.unsubscribe = pubsub.unsubscribe;

    return api as Api;
};

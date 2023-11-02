import { defaultApiStatus } from '@proton/components/containers/api/apiStatusContext';
import { updateServerTime } from '@proton/crypto/lib/serverTime';
import type {
    Api,
    ApiAuth,
    ApiCallFn,
    ApiOptions,
    ApiResult,
    ApiState,
    ApiSubscribtionEvent,
    Maybe,
} from '@proton/pass/types';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import configureApi from '@proton/shared/lib/api';
import {
    getApiError,
    getApiErrorMessage,
    getIsOfflineError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getClientID } from '@proton/shared/lib/apps/helper';
import xhr from '@proton/shared/lib/fetch/fetch';
import { withLocaleHeaders } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { localeCode } from '@proton/shared/lib/i18n';
import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

import { withApiHandlers } from './handlers';
import { type OnRefreshCallback, createRefreshHandler } from './refresh';
import { getSilenced } from './utils';

export type ApiFactoryOptions = {
    config: ProtonConfig;
    getAuth: () => Maybe<ApiAuth>;
    onRefresh: OnRefreshCallback;
};

export const createApi = ({ config, getAuth, onRefresh }: ApiFactoryOptions): Api => {
    const pubsub = createPubSub<ApiSubscribtionEvent>();
    const clientID = getClientID(config.APP_NAME);

    const state: ApiState = {
        serverTime: undefined,
        appVersionBad: false,
        offline: false,
        unreachable: false,
        sessionInactive: false,
        sessionLocked: false,
    };

    const call = configureApi({ ...config, clientID, xhr } as any) as ApiCallFn;
    const refreshHandler = createRefreshHandler({ call, getAuth, onRefresh });
    const apiCall = withApiHandlers({ call, getAuth, refreshHandler, state });

    const api = async ({ output = 'json', ...rest }: ApiOptions): Promise<ApiResult> => {
        const config = getAuth() ? rest : withLocaleHeaders(localeCode, rest);

        return apiCall(config)
            .then((response) => {
                /* The HTTP Date header is mandatory, so this should never
                 * occur. We need the server time for proper time sync: falling
                 * back to the local time can result in e.g. unverifiable signatures  */
                const serverTime = getDateHeader(response.headers);
                if (!serverTime) throw new Error('Could not fetch server time');
                state.serverTime = updateServerTime(serverTime);

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

                state.serverTime = serverTime ? updateServerTime(serverTime) : state.serverTime;
                state.unreachable = isUnreachable;
                state.offline = isOffline || defaultApiStatus.offline;
                state.appVersionBad = e.name === 'AppVersionBadError';
                state.sessionInactive = e.name === 'InactiveSession';
                state.sessionLocked = e.name === 'LockedSession';

                if (state.sessionLocked) pubsub.publish({ type: 'session', status: 'locked' });
                if (state.sessionInactive) pubsub.publish({ type: 'session', status: 'inactive' });
                if (error && !getSilenced(e.config, code)) pubsub.publish({ type: 'error', error });

                throw e;
            });
    };

    api.getState = () => state;

    api.reset = () => {
        state.serverTime = undefined;
        state.appVersionBad = false;
        state.offline = false;
        state.unreachable = false;
        state.sessionInactive = false;
        state.sessionLocked = false;
    };

    api.subscribe = pubsub.subscribe;
    api.unsubscribe = pubsub.unsubscribe;

    return api as Api;
};

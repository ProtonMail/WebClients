import { defaultApiStatus } from '@proton/components/containers/api/apiStatusContext';
import { updateServerTime } from '@proton/crypto/lib/serverTime';
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

import type {
    Api,
    ApiAuthOptions,
    ApiCallFn,
    ApiContext,
    ApiCreateOptions,
    ApiOptions,
    ApiResult,
    ApiStatus,
    ApiSubscribtionEvent,
} from '../types';
import { merge } from '../utils/object';
import { createPubSub } from '../utils/pubsub';
import { withApiHandlers } from './api-handlers';
import { createRefreshHandler } from './refresh';
import { getSilenced } from './utils';

const INITIAL_API_STATUS: ApiStatus = {
    serverTime: undefined,
    appVersionBad: false,
    offline: false,
    unreachable: false,
    sessionInactive: false,
    sessionLocked: false,
};

/**
 * Api creator inspired by `packages/components/containers/api/ApiProvider.js`
 * Omit credentials in fetch requests as we want the extension's API
 * instance to be fully decoupled from cookie based authentication
 */
const createApi = ({ config, auth, onSessionRefresh }: ApiCreateOptions): Api => {
    const pubsub = createPubSub<ApiSubscribtionEvent>();
    const clientID = getClientID(config.APP_NAME);

    const ctx: ApiContext = {
        auth,
        call: configureApi({ ...config, clientID, xhr } as any) as ApiCallFn,
        status: INITIAL_API_STATUS,
    };

    const refreshHandler = createRefreshHandler({
        apiContext: ctx,
        onRefresh: (result) => {
            onSessionRefresh?.(result);
            ctx.auth = {
                UID: result.UID,
                AccessToken: result.AccessToken,
                RefreshToken: result.RefreshToken,
            };
        },
    });

    const apiCall = withApiHandlers({ apiContext: ctx, refreshHandler });

    const api = async ({ output = 'json', ...rest }: ApiOptions): Promise<ApiResult> => {
        const config = ctx.auth ? rest : withLocaleHeaders(localeCode, rest);

        return apiCall(config)
            .then((response) => {
                const serverTime = getDateHeader(response.headers);
                if (!serverTime) {
                    /**
                     * The HTTP Date header is mandatory, so this should never occur.
                     * We need the server time for proper time sync:
                     * falling back to the local time can result in e.g. unverifiable signatures
                     */
                    throw new Error('Could not fetch server time');
                }

                ctx.status = merge(ctx.status, { serverTime: updateServerTime(serverTime) });

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
                const errorMessage = getApiErrorMessage(e);
                const isOffline = getIsOfflineError(e);
                const isUnreachable = getIsUnreachableError(e);

                ctx.status = {
                    serverTime: serverTime ? updateServerTime(serverTime) : ctx.status.serverTime,
                    unreachable: isUnreachable,
                    offline: isOffline || defaultApiStatus.offline,
                    appVersionBad: e.name === 'AppVersionBadError',
                    sessionInactive: e.name === 'InactiveSession',
                    sessionLocked: e.name === 'LockedSession',
                };

                if (ctx.status.sessionLocked) {
                    pubsub.publish({ type: 'session', status: 'locked' });
                }

                if (ctx.status.sessionInactive) {
                    pubsub.publish({ type: 'session', status: 'inactive' });
                }

                if (errorMessage && !getSilenced(e.config, code)) {
                    pubsub.publish({ type: 'error', error: errorMessage });
                }

                throw e;
            });
    };

    api.getAuth = () => ctx.auth;
    api.getStatus = () => ctx.status;
    api.configure = (auth?: ApiAuthOptions) => {
        ctx.auth = auth;
        ctx.status = INITIAL_API_STATUS;
    };

    api.subscribe = pubsub.subscribe;
    api.unsubscribe = pubsub.unsubscribe;

    api.configure(auth);

    return api as Api;
};

export default createApi;

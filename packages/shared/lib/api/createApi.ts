import { updateServerTime } from '@proton/crypto';

import { configureApi } from '../api';
import { getClientID } from '../apps/helper';
import { API_CUSTOM_ERROR_CODES } from '../errors';
import { protonFetch } from '../fetch/fetch';
import { withLocaleHeaders } from '../fetch/headers';
import { getDateHeader } from '../fetch/helpers';
import { localeCode } from '../i18n';
import type { Api } from '../interfaces';
import type { ApiRateLimiter } from './apiRateLimiter';
import { getApiError, getApiErrorMessage, getIsOfflineError, getIsUnreachableError } from './helpers/apiErrorHelper';
import { withApiHandlers } from './helpers/withApiHandlers';

export const defaultApiStatus = {
    offline: false,
    apiUnreachable: '',
    appVersionBad: false,
};

interface SilenceConfig {
    silence?: boolean | number[];
}

const getSilenced = ({ silence }: SilenceConfig = {}, code: number) => {
    if (Array.isArray(silence)) {
        return silence.includes(code);
    }
    return !!silence;
};

export type ServerTimeEvent = {
    type: 'server-time';
    payload: Date;
};
export type ApiStatusEvent = {
    type: 'status';
    payload: Partial<typeof defaultApiStatus>;
};
export type ApiNotificationEvent = {
    type: 'notification';
    payload: {
        type: 'error';
        text: string;
        id?: number;
        expiration?: number;
    };
};
export type ApiLogoutEvent = {
    type: 'logout';
    payload: {
        error: any;
    };
};
export type ApiMissingScopeEvent = {
    type: 'missing-scopes';
    payload: {
        scopes: string[];
        error: any;
        options: any;
        resolve: (value: any) => void;
        reject: (value: any) => void;
    };
};
export type ApiVerificationEvent = {
    type: 'handle-verification';
    payload: {
        token: string;
        methods: any[];
        onVerify: (token: string, tokenType: string) => Promise<any>;
        title: any;
        error: any;
        resolve: (value: any) => void;
        reject: (value: any) => void;
    };
};

export type ApiUserRestrictedEvent = {
    type: 'user-restricted';
    payload: {
        error: any;
        message: string | undefined;
        resolve: (value?: any) => void;
        reject: (value: any) => void;
    };
};

export type ApiEvent =
    | ServerTimeEvent
    | ApiStatusEvent
    | ApiNotificationEvent
    | ApiLogoutEvent
    | ApiMissingScopeEvent
    | ApiVerificationEvent
    | ApiUserRestrictedEvent;

export type ApiListenerCallback = (event: ApiEvent) => boolean;

export type ApiWithListener = Api & {
    UID: string | undefined;
    apiRateLimiter: ApiRateLimiter;
    addEventListener: (cb: ApiListenerCallback) => void;
    removeEventListener: (cb: ApiListenerCallback) => void;
};

const createApi = ({
    config,
    defaultHeaders,
    noErrorState,
    sendLocaleHeaders = true,
}: {
    sendLocaleHeaders?: boolean;
    defaultHeaders?: any;
    config: any;
    noErrorState?: boolean;
}): ApiWithListener => {
    const call = configureApi({
        ...config,
        defaultHeaders,
        clientID: getClientID(config.APP_NAME),
        protonFetch,
    }) as any;

    const listeners: ApiListenerCallback[] = [];
    const notify = (event: ApiEvent) => {
        const result = listeners.map((listener) => listener(event));
        return result.some((value) => value === true);
    };

    const handleMissingScopes = (data: any) => {
        if (!listeners.length) {
            return Promise.reject(data.error);
        }
        return new Promise((resolve, reject) => {
            const handled = notify({
                type: 'missing-scopes',
                payload: {
                    ...data,
                    resolve,
                    reject,
                },
            });
            if (handled) {
                return;
            }
            return reject(data.error);
        });
    };

    const handleVerification = (data: any) => {
        if (!listeners.length) {
            return Promise.reject(data.error);
        }
        return new Promise((resolve, reject) => {
            const handled = notify({
                type: 'handle-verification',
                payload: {
                    ...data,
                    resolve,
                    reject,
                },
            });
            if (handled) {
                return;
            }
            return reject(data.error);
        });
    };

    const handleUserRestricted = (data: any) => {
        if (!listeners.length) {
            return Promise.reject(data.error);
        }
        return new Promise((resolve, reject) => {
            const handled = notify({
                type: 'user-restricted',
                payload: {
                    ...data,
                    resolve,
                    reject,
                },
            });
            if (handled) {
                return;
            }
            return reject(data.error);
        });
    };

    const callWithApiHandlers = withApiHandlers({
        call,
        onMissingScopes: handleMissingScopes,
        onVerification: handleVerification,
        onUserRestricted: handleUserRestricted,
    }) as any;

    const offlineSet = new Set<string>();

    const callback: Api = ({ output = 'json', ...rest }: any) => {
        // Only need to send locale headers in public app
        const config = sendLocaleHeaders ? withLocaleHeaders(localeCode, rest) : rest;
        return callWithApiHandlers(config)
            .then((response: any) => {
                const serverTime = getDateHeader(response.headers);
                if (!serverTime) {
                    // The HTTP Date header is mandatory, so this should never occur.
                    // We need the server time for proper time sync:
                    // falling back to the local time can result in e.g. unverifiable signatures
                    throw new Error('Could not fetch server time');
                }

                notify({
                    type: 'server-time',
                    payload: updateServerTime(serverTime),
                });
                notify({
                    type: 'status',
                    payload: defaultApiStatus,
                });
                offlineSet.clear();

                if (output === 'stream') {
                    return response.body;
                }
                if (output === 'raw') {
                    return response;
                }
                return response[output]();
            })
            .catch((e: any) => {
                const serverTime = e.response?.headers ? getDateHeader(e.response.headers) : undefined;
                if (serverTime) {
                    notify({
                        type: 'server-time',
                        payload: updateServerTime(serverTime),
                    });
                }

                const { code } = getApiError(e);
                const errorMessage = getApiErrorMessage(e);

                const isSilenced = getSilenced(e.config, code);

                const handleErrorNotification = () => {
                    if (!errorMessage || isSilenced) {
                        return;
                    }
                    const codeExpirations = {
                        [API_CUSTOM_ERROR_CODES.USER_RESTRICTED_STATE]: 10_000,
                    };
                    notify({
                        type: 'notification',
                        payload: {
                            type: 'error',
                            text: errorMessage,
                            ...(code in codeExpirations
                                ? {
                                      key: code,
                                      expiration: codeExpirations[code],
                                  }
                                : {
                                      expiration: config?.notificationExpiration,
                                  }),
                        },
                    });
                };

                // Intended for the verify app where we always want to pass an error notification
                if (noErrorState) {
                    handleErrorNotification();
                    throw e;
                }

                const isOffline = getIsOfflineError(e);
                const isUnreachable = getIsUnreachableError(e);

                if (isOffline) {
                    offlineSet.add(e?.config?.url || '');
                } else {
                    offlineSet.clear();
                }

                if (isOffline || isUnreachable) {
                    notify({
                        type: 'status',
                        payload: {
                            apiUnreachable: isUnreachable ? errorMessage || '' : '',
                            // We wait to notify offline until at least 2 unique urls have been seen as offline
                            offline: isOffline && offlineSet.size > 1,
                        },
                    });
                    throw e;
                }
                notify({
                    type: 'status',
                    payload: {
                        apiUnreachable: defaultApiStatus.apiUnreachable,
                        offline: defaultApiStatus.offline,
                    },
                });

                if (e.name === 'AbortError' || e.cancel) {
                    throw e;
                }

                if (e.name === 'AppVersionBadError') {
                    notify({ type: 'status', payload: { appVersionBad: true } });
                    throw e;
                }

                if (e.name === 'InactiveSession') {
                    notify({ type: 'logout', payload: { error: e } });
                    throw e;
                }

                handleErrorNotification();
                throw e;
            });
    };

    const getCallbackWithListeners = (callback: Api) => {
        Object.defineProperties(callback, {
            apiRateLimiter: {
                get() {
                    return call.apiRateLimiter;
                },
            },
            UID: {
                set(value: string | undefined) {
                    callWithApiHandlers.UID = value;
                    call.UID = value;
                },
            },
        });

        return Object.assign(callback as ApiWithListener, {
            addEventListener: (cb: ApiListenerCallback) => {
                listeners.push(cb);
            },
            removeEventListener: (cb: ApiListenerCallback) => {
                listeners.splice(listeners.indexOf(cb), 1);
            },
        });
    };

    return getCallbackWithListeners(callback);
};

export default createApi;

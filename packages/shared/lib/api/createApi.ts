import { updateServerTime } from '@proton/crypto';

import configureApi from '../api';
import { getClientID } from '../apps/helper';
import { API_CUSTOM_ERROR_CODES } from '../errors';
import xhr from '../fetch/fetch';
import { withLocaleHeaders } from '../fetch/headers';
import { getDateHeader } from '../fetch/helpers';
import { localeCode } from '../i18n';
import { Api } from '../interfaces';
import { getApiError, getApiErrorMessage, getIsOfflineError, getIsUnreachableError } from './helpers/apiErrorHelper';
import withApiHandlers from './helpers/withApiHandlers';

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

type ServerTimeEvent = {
    type: 'server-time';
    payload: Date;
};
type ApiStatusEvent = {
    type: 'status';
    payload: Partial<typeof defaultApiStatus>;
};
type ApiNotificationEvent = {
    type: 'notification';
    payload: {
        type: 'error';
        text: string;
        id?: number;
        expiration?: number;
    };
};
type ApiLogoutEvent = {
    type: 'logout';
    payload: {
        error: any;
    };
};
type ApiMissingScopeEvent = {
    type: 'missing-scopes';
    payload: {
        scopes: string[];
        error: any;
        options: any;
        resolve: (value: any) => void;
        reject: (value: any) => void;
    };
};
type ApiVerificationEvent = {
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
type ApiEvent =
    | ServerTimeEvent
    | ApiStatusEvent
    | ApiNotificationEvent
    | ApiLogoutEvent
    | ApiMissingScopeEvent
    | ApiVerificationEvent;
export type ApiListenerCallback = (event: ApiEvent) => void;

export type ApiWithListener = Api & {
    UID: string | undefined;
    addEventListener: (cb: ApiListenerCallback) => void;
    removeEventListener: (cb: ApiListenerCallback) => void;
};

const createApi = ({
    config,
    noErrorState,
    sendLocaleHeaders,
}: {
    sendLocaleHeaders?: boolean;
    config: any;
    noErrorState?: boolean;
}): ApiWithListener => {
    const call = configureApi({
        ...config,
        clientID: getClientID(config.APP_NAME),
        xhr,
    }) as any;

    const listeners: ApiListenerCallback[] = [];
    const notify = (event: ApiEvent) => {
        listeners.forEach((listener) => listener(event));
    };

    const handleMissingScopes = (data: any) => {
        if (!listeners.length) {
            return Promise.reject(data.error);
        }
        return new Promise((resolve, reject) => {
            notify({
                type: 'missing-scopes',
                payload: {
                    ...data,
                    resolve,
                    reject,
                },
            });
        });
    };

    const handleVerification = (data: any) => {
        if (!listeners.length) {
            return Promise.reject(data.error);
        }
        return new Promise((resolve, reject) => {
            notify({
                type: 'handle-verification',
                payload: {
                    ...data,
                    resolve,
                    reject,
                },
            });
        });
    };

    const callWithApiHandlers = withApiHandlers({
        call,
        onMissingScopes: handleMissingScopes,
        onVerification: handleVerification,
    }) as any;

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

                const handleErrorNotification = () => {
                    if (errorMessage) {
                        const isSilenced = getSilenced(e.config, code);
                        if (!isSilenced) {
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
                        }
                    }
                };

                // Intended for the verify app where we always want to pass an error notification
                if (noErrorState) {
                    handleErrorNotification();
                    throw e;
                }

                const isOffline = getIsOfflineError(e);
                const isUnreachable = getIsUnreachableError(e);

                if (isOffline || isUnreachable) {
                    notify({
                        type: 'status',
                        payload: {
                            apiUnreachable: isUnreachable ? errorMessage || '' : '',
                            offline: isOffline,
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

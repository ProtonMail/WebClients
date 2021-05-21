import { create as createMutex } from 'mutex-browser';

import { RETRY_ATTEMPTS_MAX, RETRY_DELAY_MAX, OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY } from '../../constants';
import { createOnceHandler } from '../../apiHandlers';
import { wait } from '../../helpers/promise';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '../../errors';
import { withUIDHeaders } from '../../fetch/headers';
import { setRefreshCookies } from '../auth';
import { getApiError } from './apiErrorHelper';
import { noop, randomIntFromInterval } from '../../helpers/function';
import { getDateHeader } from '../../fetch/helpers';
import { getLastRefreshDate, setLastRefreshDate } from './refreshStorage';

export const InactiveSessionError = () => {
    const error = new Error('Inactive session');
    error.name = 'InactiveSession';
    return error;
};

export const AppVersionBadError = () => {
    const error = new Error('App version outdated');
    error.name = 'AppVersionBadError';
    return error;
};

/**
 * Handle retry-after
 * @param {Error} e
 * @returns {Promise}
 */
const retryHandler = (e) => {
    const {
        response: { headers },
    } = e;

    const retryAfterSeconds = parseInt(headers.get('retry-after') || 0, 10);

    if (retryAfterSeconds < 0 || retryAfterSeconds >= RETRY_DELAY_MAX) {
        return Promise.reject(e);
    }

    return wait(retryAfterSeconds * 1000);
};

/**
 * Handle refresh token. Happens when the access token has expired.
 * Multiple calls can fail, so this ensures the refresh route is called once.
 * Needs to re-handle errors here for that reason.
 */
const refresh = (call, UID, attempts, maxAttempts) => {
    return call(withUIDHeaders(UID, setRefreshCookies())).catch((e) => {
        if (attempts >= maxAttempts) {
            throw e;
        }

        const { status, name } = e;

        if (name === 'OfflineError') {
            if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                throw e;
            }
            return wait(OFFLINE_RETRY_DELAY).then(() => refresh(call, UID, attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX));
        }

        if (name === 'TimeoutError') {
            if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                throw e;
            }
            return refresh(call, UID, attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX);
        }

        if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
            return retryHandler(e).then(() => refresh(call, UID, attempts + 1, RETRY_ATTEMPTS_MAX));
        }

        throw e;
    });
};

/**
 * Attach a catch handler to every API call to handle 401, 403, and other errors.
 * @param {function} call
 * @param {string} UID
 * @param {function} onUnlock
 * @param {function} onVerification
 * @return {function}
 */
export default ({ call, UID, onUnlock, onVerification }) => {
    let loggedOut = false;
    let appVersionBad = false;

    const refreshHandlers = {};
    const refreshHandler = (UID, responseDate) => {
        if (!refreshHandlers[UID]) {
            const mutex = createMutex({ expiry: 15000 });

            const getMutexLock = async (UID) => {
                try {
                    await mutex.lock(UID);
                    return () => {
                        return mutex.unlock(UID).catch(noop);
                    };
                } catch (e) {
                    // If getting the mutex fails, fall back to a random wait
                    await wait(randomIntFromInterval(100, 2000));
                    return () => {
                        return Promise.resolve();
                    };
                }
            };

            /**
             * Refreshing the session needs to handle multiple race conditions.
             * 1) Race conditions within the context (tab). Solved by the once handler.
             * 2) Race conditions within multiple contexts (tabs). Solved by the shared mutex.
             */
            refreshHandlers[UID] = createOnceHandler(async (responseDate = new Date()) => {
                const unlockMutex = await getMutexLock(UID);
                try {
                    const lastRefreshDate = getLastRefreshDate(UID);
                    if (lastRefreshDate === undefined || responseDate > lastRefreshDate) {
                        const result = await refresh(call, UID, 1, RETRY_ATTEMPTS_MAX);
                        setLastRefreshDate(UID, getDateHeader(result.headers) || new Date());
                        // Add an artificial delay to ensure cookies are properly updated to avoid race conditions
                        await wait(50);
                    }
                } finally {
                    await unlockMutex();
                }
            });
        }

        return refreshHandlers[UID](responseDate);
    };
    const unlockHandler = createOnceHandler(onUnlock);

    return (options) => {
        const perform = (attempts, maxAttempts) => {
            if (loggedOut) {
                return Promise.reject(InactiveSessionError());
            }
            if (appVersionBad) {
                return Promise.reject(AppVersionBadError());
            }

            return call(options).catch((e) => {
                if (loggedOut) {
                    throw InactiveSessionError();
                }

                if (maxAttempts && attempts >= maxAttempts) {
                    throw e;
                }

                const { status, name, response } = e;

                const {
                    ignoreHandler,
                    silence = [],
                    headers,
                    retriesOnOffline = OFFLINE_RETRY_ATTEMPTS_MAX,
                    retriesOnTimeout = OFFLINE_RETRY_ATTEMPTS_MAX,
                } = options || {};

                if (name === 'OfflineError') {
                    if (attempts > retriesOnOffline) {
                        throw e;
                    }
                    return wait(OFFLINE_RETRY_DELAY).then(() => perform(attempts + 1, retriesOnOffline));
                }

                if (name === 'TimeoutError') {
                    if (attempts > retriesOnTimeout) {
                        throw e;
                    }
                    return perform(attempts + 1, retriesOnTimeout);
                }

                const ignoreUnauthorized =
                    Array.isArray(ignoreHandler) && ignoreHandler.includes(HTTP_ERROR_CODES.UNAUTHORIZED);
                const requestUID = (headers && headers['x-pm-uid']) || UID;
                // Sending a request with a UID but without an authorization header is when the public app makes
                // authenticated requests (mostly for persisted sessions), and ignoring "login" or "signup" requests.
                if (
                    status === HTTP_ERROR_CODES.UNAUTHORIZED &&
                    !ignoreUnauthorized &&
                    (UID || (requestUID && !(headers && !!headers.Authorization)))
                ) {
                    return refreshHandler(requestUID, getDateHeader(response && response.headers)).then(
                        () => perform(attempts + 1, RETRY_ATTEMPTS_MAX),
                        (error) => {
                            // Any 4xx and the session is no longer valid, 429 is already handled in the refreshHandler
                            if (error.status >= 400 && error.status <= 499) {
                                // Disable any further requests on this session if it was created with a UID
                                if (UID) {
                                    loggedOut = true;
                                }
                                throw InactiveSessionError();
                            }
                            throw error;
                        }
                    );
                }

                const ignoreUnlock = Array.isArray(ignoreHandler) && ignoreHandler.includes(HTTP_ERROR_CODES.UNLOCK);
                if (status === HTTP_ERROR_CODES.UNLOCK && !ignoreUnlock) {
                    const { Details: { MissingScopes: missingScopes = [] } = {} } = e.data || {};
                    return unlockHandler(missingScopes, e).then(() => perform(attempts + 1, RETRY_ATTEMPTS_MAX));
                }

                const ignoreTooManyRequests =
                    Array.isArray(ignoreHandler) && ignoreHandler.includes(HTTP_ERROR_CODES.TOO_MANY_REQUESTS);
                if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS && !ignoreTooManyRequests) {
                    return retryHandler(e).then(() => perform(attempts + 1, RETRY_ATTEMPTS_MAX));
                }

                const { code } = getApiError(e);

                if (code === API_CUSTOM_ERROR_CODES.APP_VERSION_BAD) {
                    appVersionBad = true;
                    throw AppVersionBadError();
                }

                const ignoreHumanVerification =
                    Array.isArray(ignoreHandler) &&
                    ignoreHandler.includes(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED);
                if (code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED && !ignoreHumanVerification) {
                    const {
                        Details: { HumanVerificationToken: captchaToken, HumanVerificationMethods: methods = [] } = {},
                    } = e.data || {};

                    const onVerify = (token, tokenType) => {
                        return call({
                            ...options,
                            silence:
                                silence === true
                                    ? true
                                    : [
                                          ...(Array.isArray(silence) ? silence : []),
                                          API_CUSTOM_ERROR_CODES.TOKEN_INVALID,
                                      ],
                            headers: {
                                ...options.headers,
                                'x-pm-human-verification-token': token,
                                'x-pm-human-verification-token-type': tokenType,
                            },
                        });
                    };

                    return onVerification({ token: captchaToken, methods, onVerify }, e);
                }

                throw e;
            });
        };

        return perform(1);
    };
};

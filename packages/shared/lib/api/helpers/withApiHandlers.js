import { setRefreshCookies } from '@proton/shared/lib/api/auth';

import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '../../constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '../../errors';
import { getUIDHeaderValue, getVerificationHeaders, withUIDHeaders } from '../../fetch/headers';
import { getDateHeader } from '../../fetch/helpers';
import { wait } from '../../helpers/promise';
import { getApiError } from './apiErrorHelper';
import { createRefreshHandlers, getIsRefreshFailure, refresh } from './refreshHandlers';
import { retryHandler } from './retryHandler';

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
 * Attach a catch handler to every API call to handle 401, 403, and other errors.
 * @param {function} call
 * @param {string} UID
 * @param {function} onMissingScopes
 * @param {function} onVerification
 * @return {function}
 */
export default ({ call, UID, onMissingScopes, onVerification }) => {
    let loggedOut = false;
    let appVersionBad = false;

    const refreshHandler = createRefreshHandlers((UID) => {
        return refresh(() => call(withUIDHeaders(UID, setRefreshCookies())), 1, RETRY_ATTEMPTS_MAX);
    });

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
                const requestUID = getUIDHeaderValue(headers) ?? UID;
                // Sending a request with a UID but without an authorization header is when the public app makes
                // authenticated requests (mostly for persisted sessions), and ignoring "login" or "signup" requests.
                if (
                    status === HTTP_ERROR_CODES.UNAUTHORIZED &&
                    !ignoreUnauthorized &&
                    (UID || (requestUID && !headers?.Authorization))
                ) {
                    return refreshHandler(requestUID, getDateHeader(response && response.headers)).then(
                        () => perform(attempts + 1, RETRY_ATTEMPTS_MAX),
                        (error) => {
                            if (getIsRefreshFailure(error)) {
                                // Disable any further requests on this session if it was created with a UID and the request was done with the failing UID
                                if (UID && requestUID === UID) {
                                    loggedOut = true;
                                    // Inactive session error is only thrown when this error was caused by a logged in session requesting through the same UID
                                    // to have a specific error consumers can use
                                    throw InactiveSessionError();
                                }
                                // The original 401 error is thrown to make it more clear that this auth & refresh failure
                                // was caused by an original auth failure and consumers can just check for 401 instead of 4xx
                                throw e;
                            }
                            // Otherwise, this is not actually an authentication error, it might have failed because the API responds with 5xx, or because the client is offline etc
                            // and as such the error from the refresh call is thrown
                            throw error;
                        }
                    );
                }

                const ignoreUnlock = Array.isArray(ignoreHandler) && ignoreHandler.includes(HTTP_ERROR_CODES.UNLOCK);
                if (status === HTTP_ERROR_CODES.UNLOCK && !ignoreUnlock) {
                    const { Details: { MissingScopes: missingScopes = [] } = {} } = e.data || {};
                    return onMissingScopes({
                        scopes: missingScopes,
                        error: e,
                        options,
                    });
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
                        Details: {
                            HumanVerificationToken: captchaToken,
                            HumanVerificationMethods: methods = [],
                            Title: title,
                        } = {},
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
                                ...getVerificationHeaders(token, tokenType),
                            },
                        });
                    };

                    return onVerification({ token: captchaToken, methods, onVerify, title }, e);
                }

                throw e;
            });
        };

        return perform(1);
    };
};

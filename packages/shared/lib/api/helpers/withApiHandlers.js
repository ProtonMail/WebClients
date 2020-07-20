import { setRefreshCookies } from '../auth';
import { createOnceHandler, getError } from '../../apiHandlers';
import { RETRY_ATTEMPTS_MAX, RETRY_DELAY_MAX, OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY } from '../../constants';
import { wait } from '../../helpers/promise';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '../../errors';

export const InactiveSessionError = () => {
    const error = new Error('Inactive session');
    error.name = 'InactiveSession';
    return error;
};

export const RetryError = () => {
    const error = new Error('Retry-After');
    error.name = 'RetryAfterError';
    return error;
};

export const CancelUnlockError = () => {
    const error = new Error('Cancel unlock');
    error.name = 'CancelUnlock';
    return error;
};

export const CancelVerificationError = () => {
    const error = new Error('Cancel verification');
    error.name = 'CancelVerification';
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
        return Promise.reject(RetryError());
    }

    return wait(retryAfterSeconds * 1000);
};

/**
 * Attach a catch handler to every API call to handle 401, 403, and other errors.
 * @param {function} call
 * @param {boolean} hasSession
 * @param {function} onUnlock
 * @param {function} onError
 * @param {function} onVerification
 * @return {function}
 */
export default ({ call, hasSession, onUnlock, onError, onVerification }) => {
    let loggedOut = false;

    /**
     * Handle refresh token. Happens when the access token has expired.
     * Multiple calls can fail, so this ensures the refresh route is called once.
     * Needs to re-handle errors here for that reason.
     */
    const refresh = (attempts, maxAttempts) =>
        call(setRefreshCookies()).catch((e) => {
            if (attempts >= maxAttempts) {
                throw e;
            }

            const { status, name } = e;

            if (name === 'OfflineError') {
                if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                    throw e;
                }
                return wait(OFFLINE_RETRY_DELAY).then(() => refresh(attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX));
            }

            if (name === 'TimeoutError') {
                if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                    throw e;
                }
                return refresh(attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX);
            }

            if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
                return retryHandler(e).then(() => refresh(attempts + 1, RETRY_ATTEMPTS_MAX));
            }

            throw e;
        });
    const refreshHandler = createOnceHandler(() => {
        return refresh(1, RETRY_ATTEMPTS_MAX);
    });
    const unlockHandler = createOnceHandler(onUnlock);

    return (options) => {
        const perform = (attempts, maxAttempts) => {
            if (loggedOut) {
                return Promise.resolve().then(() => {
                    return onError(InactiveSessionError());
                });
            }

            return call(options).catch((e) => {
                if (loggedOut) {
                    return onError(InactiveSessionError());
                }

                if (maxAttempts && attempts >= maxAttempts) {
                    return onError(e);
                }

                const { status, name } = e;

                if (name === 'OfflineError') {
                    if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                        return onError(e);
                    }
                    return wait(OFFLINE_RETRY_DELAY).then(() => perform(attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX));
                }

                if (name === 'TimeoutError') {
                    if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                        return onError(e);
                    }
                    return perform(attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX);
                }

                if (hasSession && status === HTTP_ERROR_CODES.UNAUTHORIZED) {
                    return refreshHandler().then(
                        () => perform(attempts + 1, RETRY_ATTEMPTS_MAX),
                        (error) => {
                            // Any 4xx and the session is no longer valid, 429 is already handled in the refreshHandler
                            if ((error.status >= 400 && error.status <= 499) || error.name === 'RetryAfterError') {
                                loggedOut = true;
                                return onError(InactiveSessionError());
                            }
                            return onError(error);
                        }
                    );
                }

                if (status === HTTP_ERROR_CODES.UNLOCK) {
                    const { Details: { MissingScopes: missingScopes = [] } = {} } = e.data || {};
                    return unlockHandler(missingScopes).then(
                        () => perform(attempts + 1, RETRY_ATTEMPTS_MAX),
                        (unlockError) => onError(unlockError)
                    );
                }

                if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
                    return retryHandler(e).then(
                        () => perform(attempts + 1, RETRY_ATTEMPTS_MAX),
                        () => onError(e)
                    );
                }

                const { code } = getError(e);

                if (code === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED) {
                    const { ignoreHandler, silence = [] } = options;
                    if (
                        Array.isArray(ignoreHandler) &&
                        ignoreHandler.includes(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED)
                    ) {
                        return onError(e);
                    }

                    const {
                        Details: { HumanVerificationToken: captchaToken, HumanVerificationMethods: methods = [] } = {},
                    } = e.data || {};

                    const onVerify = (token, tokenType) => {
                        return call({
                            ...options,
                            silence: [...silence, API_CUSTOM_ERROR_CODES.TOKEN_INVALID],
                            headers: {
                                ...options.headers,
                                'x-pm-human-verification-token': token,
                                'x-pm-human-verification-token-type': tokenType,
                            },
                        }).catch(onError);
                    };

                    return onVerification({ token: captchaToken, methods, onVerify });
                }

                return onError(e);
            });
        };

        return perform(1);
    };
};

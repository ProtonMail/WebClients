import { type ApiAuth, type ApiCallFn, type ApiOptions, type ApiState, AuthMode, type Maybe } from '@proton/pass/types';
import type { ObjectHandler } from '@proton/pass/utils/object/handler';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { AppVersionBadError, InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { retryHandler } from '@proton/shared/lib/api/helpers/retryHandler';
import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { wait } from '@proton/shared/lib/helpers/promise';

import { LockedSessionError, PassErrorCode } from './errors';
import type { RefreshHandler } from './refresh';

type ApiHandlersOptions = {
    state: ObjectHandler<ApiState>;
    call: ApiCallFn;
    getAuth: () => Maybe<ApiAuth>;
    refreshHandler: RefreshHandler;
};

/* Simplified version of withApiHandlers.js :
 * - handles recursive session refresh
 * - handles appBadVersion
 * - handles basic offline error detection
 * - FIXME: handle code 9001 errors with human verification  */
export const withApiHandlers = ({ state, call, getAuth, refreshHandler }: ApiHandlersOptions): ApiCallFn => {
    return (options: ApiOptions) => {
        const {
            ignoreHandler = [],
            retriesOnOffline = OFFLINE_RETRY_ATTEMPTS_MAX,
            retriesOnTimeout = OFFLINE_RETRY_ATTEMPTS_MAX,
        } = options ?? {};

        const next = async (attempts: number, maxAttempts?: number): Promise<any> => {
            if (state.get('appVersionBad')) throw AppVersionBadError();

            /** Unauthenticated API calls should not be
             * blocked by the current API error state. */
            if (!options.unauthenticated) {
                if (state.get('sessionInactive')) throw InactiveSessionError();
                if (state.get('sessionLocked')) throw LockedSessionError();
            }

            try {
                /** Check if the request was queued and possibly aborted :
                 * throw an error early to prevent triggering the API call */
                if (options.signal?.aborted) throw new Error('Aborted');

                const config = (() => {
                    /** If the request was passed a custom UID - use it
                     * instead of the standard authentication store value */
                    const auth = options.auth ?? getAuth();
                    if (!auth) return options;

                    return auth.type === AuthMode.COOKIE
                        ? withUIDHeaders(auth.UID, options)
                        : withAuthHeaders(auth.UID, auth.AccessToken, options);
                })();

                return await call(config);
            } catch (error: any) {
                const { status, name, response } = error;
                const { code } = getApiError(error);

                if (maxAttempts && attempts >= maxAttempts) throw error;

                /* Inactive extension session : only throw a `LockedSessionError`
                 * when we have not reached the max amount of unlock tries. After
                 * 3 unsuccessful attempts - we will get a 401 */
                if (code === PassErrorCode.SESSION_LOCKED && status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
                    throw LockedSessionError();
                }

                if (code === API_CUSTOM_ERROR_CODES.APP_VERSION_BAD) throw AppVersionBadError();

                if (name === 'OfflineError') {
                    if (attempts > retriesOnOffline) throw error;
                    await wait(OFFLINE_RETRY_DELAY);
                    return next(attempts + 1, retriesOnOffline);
                }

                if (name === 'TimeoutError') {
                    if (attempts > retriesOnTimeout) throw error;
                    return next(attempts + 1, retriesOnTimeout);
                }

                if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS && !ignoreHandler.includes(status)) {
                    await retryHandler(error);
                    return next(attempts + 1, RETRY_ATTEMPTS_MAX);
                }

                if (status === HTTP_ERROR_CODES.UNPROCESSABLE_ENTITY) {
                    /* Catch inactive session errors during cookie upgrade */
                    if (code === PassErrorCode.INVALID_COOKIES_REFRESH) throw InactiveSessionError();
                }

                if (status === HTTP_ERROR_CODES.UNAUTHORIZED && !ignoreHandler.includes(status)) {
                    if (code === PassErrorCode.SESSION_ERROR) throw InactiveSessionError();

                    try {
                        state.set('refreshing', true);
                        await refreshHandler(response, options);
                        return await next(attempts + 1, RETRY_ATTEMPTS_MAX);
                    } catch (err: any) {
                        if (err.status >= 400 && err.status <= 499) throw InactiveSessionError();
                        throw err;
                    } finally {
                        state.set('refreshing', false);
                    }
                }

                throw error;
            }
        };

        return next(1);
    };
};

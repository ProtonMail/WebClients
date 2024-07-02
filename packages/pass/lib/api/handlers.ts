import type { ApiAuth, ApiCallFn, ApiOptions, ApiState, Maybe } from '@proton/pass/types';
import type { ObjectHandler } from '@proton/pass/utils/object/handler';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { AppVersionBadError, InactiveSessionError } from '@proton/shared/lib/api/helpers/errors';
import { retryHandler } from '@proton/shared/lib/api/helpers/retryHandler';
import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { wait } from '@proton/shared/lib/helpers/promise';

import { LockedSessionError, PassErrorCode } from './errors';
import type { RefreshHandler } from './refresh';

type ApiHandlersOptions = {
    call: ApiCallFn;
    getAuth: () => Maybe<ApiAuth>;
    refreshHandler: RefreshHandler;
    state: ObjectHandler<ApiState>;
};

/* Simplified version of withApiHandlers.js :
 * - handles recursive session refresh
 * - handles appBadVersion
 * - handles basic offline error detection
 * - FIXME: handle code 9001 errors with human verification  */
export const withApiHandlers = ({ call, getAuth, refreshHandler, state }: ApiHandlersOptions): ApiCallFn => {
    return (options: ApiOptions) => {
        const {
            ignoreHandler = [],
            retriesOnOffline = OFFLINE_RETRY_ATTEMPTS_MAX,
            retriesOnTimeout = OFFLINE_RETRY_ATTEMPTS_MAX,
        } = options ?? {};

        const next = async (attempts: number, maxAttempts?: number): Promise<any> => {
            if (!options.unauth) {
                if (state.get('sessionInactive')) throw InactiveSessionError();
                if (state.get('sessionLocked')) throw LockedSessionError();
                if (state.get('appVersionBad')) throw AppVersionBadError();
            }

            try {
                /** Check if the request was queued and possibly aborted :
                 * throw an error early to prevent triggering the API call */
                if (options.signal?.aborted) throw new Error('Aborted');

                const auth = getAuth();
                return await call(auth ? withAuthHeaders(auth.UID, auth.AccessToken, options) : options);
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

                if (status === HTTP_ERROR_CODES.UNAUTHORIZED && !ignoreHandler.includes(status)) {
                    if (code === PassErrorCode.SESSION_ERROR) throw InactiveSessionError();

                    try {
                        state.set('refreshing', true);
                        await refreshHandler(response);
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

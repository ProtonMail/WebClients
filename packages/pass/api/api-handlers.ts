import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { AppVersionBadError, InactiveSessionError } from '@proton/shared/lib/api/helpers/withApiHandlers';
import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withAuthHeaders } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { wait } from '@proton/shared/lib/helpers/promise';

import type { ApiCallFn, ApiContext, ApiOptions } from '../types/api';
import { LockedSessionError } from './errors';
import type { RefreshHandler } from './refresh';

type ApiHandlersOptions = {
    refreshHandler: RefreshHandler;
    apiContext: ApiContext;
};

/**
 * Simplified version of withApiHandlers.js :
 * - handles recursive session refresh
 * - handles appBadVersion
 * - handles basic offline error detection
 * - TODO: handle 429 TOO_MANY_REQUESTS errors
 */
export const withApiHandlers = ({ apiContext, refreshHandler }: ApiHandlersOptions): ApiCallFn => {
    return (options: ApiOptions) => {
        const {
            ignoreHandler = [],
            retriesOnOffline = OFFLINE_RETRY_ATTEMPTS_MAX,
            retriesOnTimeout = OFFLINE_RETRY_ATTEMPTS_MAX,
        } = options || {};

        const next = async (attempts: number, maxAttempts?: number): Promise<any> => {
            if (apiContext.status.sessionInactive) throw InactiveSessionError();
            if (apiContext.status.appVersionBad) throw AppVersionBadError();
            if (
                options.url?.startsWith('pass') &&
                options.url !== 'pass/v1/user/session/lock/unlock' &&
                apiContext.status.sessionLocked
            ) {
                throw LockedSessionError();
            }

            try {
                const response = await apiContext.call(
                    apiContext.auth !== undefined
                        ? withAuthHeaders(apiContext.auth.UID, apiContext.auth.AccessToken, options)
                        : options
                );

                return response;
            } catch (error: any) {
                const { status, name, response } = error;
                const { code } = getApiError(error);

                if (maxAttempts && attempts >= maxAttempts) throw error;

                if (code === API_CUSTOM_ERROR_CODES.APP_VERSION_BAD) {
                    throw AppVersionBadError();
                }

                if (name === 'OfflineError') {
                    if (attempts > retriesOnOffline) throw error;
                    await wait(OFFLINE_RETRY_DELAY);
                    return next(attempts + 1, retriesOnOffline);
                }

                if (name === 'TimeoutError') {
                    if (attempts > retriesOnTimeout) throw error;
                    return next(attempts + 1, retriesOnTimeout);
                }

                if (code === 300008 /* Inactive extension session */) {
                    throw LockedSessionError();
                }

                if (
                    !ignoreHandler.includes(HTTP_ERROR_CODES.UNAUTHORIZED) &&
                    status === HTTP_ERROR_CODES.UNAUTHORIZED
                ) {
                    try {
                        await refreshHandler(getDateHeader(response && response.headers));
                        return next(attempts + 1, RETRY_ATTEMPTS_MAX);
                    } catch (e: any) {
                        if (e.status >= 400 && e.status <= 499) {
                            throw InactiveSessionError();
                        }
                        throw e;
                    }
                }

                throw error;
            }
        };

        return next(1);
    };
};

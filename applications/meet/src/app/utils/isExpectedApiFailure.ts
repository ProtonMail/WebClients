import {
    getApiError,
    getIs401Error,
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '@proton/shared/lib/errors';

/**
 * Check if error is expected to avoid reporting it to Sentry.
 */
export const isExpectedApiFailure = (error: any) => {
    if (!error) {
        return false;
    }

    if (
        error.userNotified ||
        getIsOfflineError(error) ||
        getIsNetworkError(error) ||
        getIsTimeoutError(error) ||
        getIs401Error(error)
    ) {
        return true;
    }

    const { code, status } = getApiError(error);

    return status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS || code === API_CUSTOM_ERROR_CODES.NOT_FOUND;
};

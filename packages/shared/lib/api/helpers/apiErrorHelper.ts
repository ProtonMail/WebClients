import { c } from 'ttag';

import { API_CODES, HTTP_STATUS_CODE } from '../../constants';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '../../errors';

export const isNotExistError = (error: any) => {
    const notExistErrorCodes = [
        API_CODES.INVALID_ID_ERROR,
        API_CODES.NOT_FOUND_ERROR,
        /**
         * Mail Specific: Conversation does not exist
         */
        20052,
    ];

    return Boolean(notExistErrorCodes.includes(error.data?.Code));
};

export const getApiError = (e?: any) => {
    if (!e) {
        return {};
    }
    const { data, status } = e;

    if (!data) {
        return {
            status,
        };
    }

    const { Error: errorMessage, Code: errorCode, Details: errorDetails } = data;

    if (!errorMessage) {
        return {
            status,
        };
    }

    return {
        status,
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
    };
};

export const getIs401Error = (e: any) => {
    if (!e) {
        return false;
    }
    return e.name === 'InactiveSession' || e.status === 401;
};

export const getIsOfflineError = (e: any) => {
    if (!e) {
        return false;
    }
    return e.name === 'OfflineError';
};

export const getIsUnreachableError = (e: any) => {
    if (!e) {
        return false;
    }
    // On 503, even if there's response, it's an unreachable error
    if (e.status === HTTP_ERROR_CODES.SERVICE_UNAVAILABLE) {
        return true;
    }
    // On 502 or 504, we verify that the API did not actually give a response. It can return these codes when acting as a proxy (e.g. email-list unsubscribe).
    return (
        [HTTP_ERROR_CODES.BAD_GATEWAY, HTTP_ERROR_CODES.GATEWAY_TIMEOUT].includes(e.status) &&
        e.data?.Code === undefined
    );
};

export const getIsNetworkError = (e: any) => {
    if (!e) {
        return false;
    }
    return e.name === 'NetworkError' || e.message?.toLowerCase() === 'network error';
};

export const getIsTimeoutError = (e: any) => {
    if (!e) {
        return false;
    }
    return e.name === 'TimeoutError';
};

export const getIsConnectionIssue = (e: any) => {
    return getIsOfflineError(e) || getIsUnreachableError(e) || getIsNetworkError(e) || getIsTimeoutError(e);
};

export const getApiErrorMessage = (e: any): string | undefined => {
    const { message } = getApiError(e);
    if (getIs401Error(e)) {
        return message || c('Info').t`Session timed out`;
    }
    if (getIsOfflineError(e)) {
        return message || c('Info').t`Internet connection lost`;
    }
    if (getIsUnreachableError(e)) {
        return message || c('Info').t`Servers are unreachable. Please try again in a few minutes`;
    }
    if (getIsTimeoutError(e)) {
        return message || c('Error').t`Request timed out`;
    }
    if (message) {
        return `${message}`;
    }
};

export const getIsMissingScopeError = (e: any) => {
    const { status, code } = getApiError(e);
    return status === HTTP_STATUS_CODE.FORBIDDEN && code === API_CUSTOM_ERROR_CODES.SCOPE_MISSING_UNEXPECTED;
};

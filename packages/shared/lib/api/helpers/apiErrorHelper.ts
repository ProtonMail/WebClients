import { c } from 'ttag';
import { HTTP_ERROR_CODES } from '../../errors';

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

    const { Error: errorMessage, Code: errorCode } = data;

    if (!errorMessage) {
        return {
            status,
        };
    }

    return {
        status,
        code: errorCode,
        message: errorMessage,
    };
};

export const getIs401Error = (e: any) => {
    if (!e) {
        return false;
    }
    return e.name === 'InactiveSession' || e.status === 401;
};

export const getIsUnreachableError = (e: any) => {
    if (!e) {
        return false;
    }
    return (
        e.name === 'OfflineError' ||
        [HTTP_ERROR_CODES.BAD_GATEWAY, HTTP_ERROR_CODES.SERVICE_UNAVAILABLE].includes(e.status)
    );
};

export const getIsTimeoutError = (e: any) => {
    if (!e) {
        return false;
    }
    return e.name === 'TimeoutError' || [HTTP_ERROR_CODES.GATEWAY_TIMEOUT].includes(e.status);
};

export const getApiErrorMessage = (e: Error) => {
    const { message } = getApiError(e);
    if (getIs401Error(e)) {
        return message || c('Info').t`Session timed out.`;
    }
    if (getIsUnreachableError(e)) {
        return message || c('Info').t`Servers are unreachable.`;
    }
    if (getIsTimeoutError(e)) {
        return message || c('Error').t`Request timed out.`;
    }
    if (message) {
        return `${message}`;
    }
};

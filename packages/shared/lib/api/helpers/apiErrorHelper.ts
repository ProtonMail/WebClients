import { c } from 'ttag';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

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

export const getApiErrorMessage = (e: Error) => {
    const { message, code } = getApiError(e);
    if (code === API_CUSTOM_ERROR_CODES.APP_VERSION_BAD) {
        return message || c('Info').t`Application upgrade required`;
    }
    if (getIs401Error(e)) {
        return message || c('Info').t`Session timed out.`;
    }
    if (e.name === 'OfflineError') {
        return c('Error').t`Servers are unreachable.`;
    }
    if (e.name === 'TimeoutError') {
        return c('Error').t`Request timed out.`;
    }
    if (message) {
        return `${message}`;
    }
};

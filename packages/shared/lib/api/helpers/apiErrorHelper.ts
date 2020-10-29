import { c } from 'ttag';

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
    const { message } = getApiError(e);
    if (getIs401Error(e)) {
        return message || c('Info').t`Session timed out.`;
    }
    if (e.name === 'TimeoutError') {
        return c('Error').t`Request timed out.`;
    }
    if (message) {
        return `${message}`;
    }
};

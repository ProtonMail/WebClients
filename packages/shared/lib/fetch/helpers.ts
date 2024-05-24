import { createApiError } from './ApiError';

const appendQueryParams = (url: URL, params: { [key: string]: any }) => {
    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (typeof value === 'undefined') {
            return;
        }
        url.searchParams.append(key, value);
    });
};

export const createUrl = (urlString: string, params: { [key: string]: any } = {}, origin?: string) => {
    let url: URL;
    if (origin) {
        url = new URL(urlString, origin);
    } else {
        url = new URL(urlString);
    }
    appendQueryParams(url, params);
    return url;
};

export const checkStatus = (response: Response, config: any) => {
    const { status } = response;

    if (status >= 200 && status < 300) {
        return response;
    }

    return response
        .json()
        .catch(() => {
            return {};
        })
        .then((data) => {
            throw createApiError('StatusCodeError', response, config, data);
        });
};

export const getDateHeader = (headers: Headers) => {
    const dateHeader = headers?.get?.('date');
    if (!dateHeader) {
        return;
    }
    const newServerTime = new Date(dateHeader);
    if (Number.isNaN(+newServerTime)) {
        return;
    }
    return newServerTime;
};

export const serializeFormData = (data: { [key: string]: any }) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) {
            data[key].forEach((val: any) => formData.append(key, val));
        } else {
            formData.append(key, data[key]);
        }
    });
    return formData;
};

export const serializeData = (data: any, input: string) => {
    if (!data) {
        return {};
    }
    if (input === 'json') {
        return {
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }
    if (input === 'form') {
        return {
            body: serializeFormData(data),
        };
    }
    if (input === 'protobuf') {
        return {
            body: data,
            headers: {
                'content-type': 'application/x-protobuf',
            },
        };
    }
    return {};
};

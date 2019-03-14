export const createApiError = (response, data, config) => {
    const error = new Error(response.statusText);

    error.response = response;
    error.status = response.status;
    error.data = data;
    error.config = config;

    return error;
};

const appendQueryParams = (url, params) => {
    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (typeof value === 'undefined') {
            return;
        }
        url.searchParams.append(key, value);
    });
};

export const createUrl = (urlString, params = {}) => {
    const url = new URL(urlString);
    appendQueryParams(url, params);
    return url;
};

export const mergeHeaders = ({ headers: configHeaders, ...restConfig }, headers) => ({
    ...restConfig,
    headers: {
        ...configHeaders,
        ...headers
    }
});

export const checkStatus = (response, config) => {
    const { status } = response;

    if (status >= 200 && status < 300) {
        return response;
    }

    return response
        .json()
        .catch(() => '')
        .then((data) => {
            throw createApiError(response, data, config);
        });
};

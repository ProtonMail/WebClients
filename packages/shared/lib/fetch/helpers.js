import { updateServerTime } from 'pmcrypto';

/**
 * Create an API error.
 * @param {Object} response - Full response object
 * @param {any} data - Data received
 * @param {Object} config - Config used
 * @returns {Error}
 */
export const createApiError = (response, data, config) => {
    const error = new Error(response.statusText);

    error.response = response;
    error.status = response.status;
    error.data = data;
    error.config = config;

    return error;
};

/**
 * Append query parameters to a URL.
 * This is to support URLs which already have query parameters.
 * @param {String} url
 * @param {Object} params
 */
const appendQueryParams = (url, params) => {
    Object.keys(params).forEach((key) => {
        const value = params[key];
        if (typeof value === 'undefined') {
            return;
        }
        url.searchParams.append(key, value);
    });
};

/**
 * Create a URL from a string and query parameters object.
 * @param {String} urlString
 * @param {Object} params
 * @returns {URL}
 */
export const createUrl = (urlString, params = {}) => {
    const url = new URL(urlString);
    appendQueryParams(url, params);
    return url;
};

/**
 * Merge headers for the request.
 * @param {Object} configHeaders
 * @param {Object} restConfig
 * @param {Object} headers
 * @returns {Object}
 */
export const mergeHeaders = ({ headers: configHeaders, ...restConfig }, headers) => ({
    ...restConfig,
    headers: {
        ...configHeaders,
        ...headers
    }
});

/**
 * Check the status of the response, and throw if needed.
 * @param {Object} response - Full response
 * @param {Object} config - Used config
 * @returns {Promise}
 */
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

/**
 * Check if the date header exists, and set the latest servertime in pmcrypto.
 * @param {Object} response - Full response
 * @returns {Object}
 */
export const checkDateHeader = (response) => {
    const { headers } = response;

    const dateHeader = headers.get('date');
    const newServerTime = new Date(dateHeader);

    if (dateHeader && !Number.isNaN(+newServerTime)) {
        updateServerTime(newServerTime);
    }

    return response;
};

/**
 * Create FormData from an object
 * @param {Object} data
 * @returns {FormData}
 */
export const serializeFormData = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
        formData.append(key, data[key]);
    });
    return formData;
};

/**
 * Serialize data and create the body and headers needed.
 * @param {Object} data
 * @param {String} input
 * @returns {Object}
 */
export const serializeData = (data, input) => {
    if (!data) {
        return {};
    }
    if (input === 'json') {
        return {
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        };
    }
    if (input === 'form') {
        return {
            body: serializeFormData(data)
        };
    }
    return {};
};

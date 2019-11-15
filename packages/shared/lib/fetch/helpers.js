/**
 * Create an API error.
 * @param {String} name - Name of error
 * @param {Object} response - Full response object
 * @param {Object} [data] - JSON data received
 * @param {Object} config - Config used
 * @returns {Error}
 */
export const createApiError = ({ response, data, config, name }) => {
    const { statusText, status } = response;

    const error = new Error(statusText);

    error.name = name;
    error.response = response;
    error.status = status;
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
    const url = new URL(urlString, window.location.origin);
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
        .catch(() => {})
        .then((data) => {
            throw createApiError({ name: 'StatusCodeError', response, data, config });
        });
};

/**
 * Get the date header if it exists.
 * @param {Object} headers - Full headers from the response
 * @returns {Date}
 */
export const getDateHeader = (headers) => {
    const dateHeader = headers.get('date');
    if (!dateHeader) {
        return;
    }
    const newServerTime = new Date(dateHeader);
    if (Number.isNaN(+newServerTime)) {
        return;
    }
    return newServerTime;
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

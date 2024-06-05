import { getAppVersionHeaders, getUIDHeaders } from './fetch/headers';

const addClientSecret = ['core/v4/auth', 'core/v4/auth/info', 'auth/v4/sessions'];

/**
 * Create a function that can call the API with the correct parameters.
 * @param {function} xhr - Fetch function
 * @param {String} API_URL - The URL to the API
 * @param {String} APP_VERSION - The app version
 * @param {String} CLIENT_ID - The id of the client
 * @param {String} [CLIENT_SECRET] - Optional client secret
 * @param {Object} defaultHeaders - This help to override parameters in the default headers
 * @return {function}
 */
export default ({
    xhr,
    UID,
    API_URL,
    APP_VERSION,
    clientID,
    CLIENT_SECRET,
    defaultHeaders: otherDefaultHeaders = {},
}) => {
    let authHeaders = UID ? getUIDHeaders(UID) : undefined;
    const appVersionHeaders = getAppVersionHeaders(clientID, APP_VERSION);

    const defaultHeaders = {
        accept: 'application/vnd.protonmail.v1+json',
        ...appVersionHeaders,
        ...otherDefaultHeaders,
    };

    const cb = ({ url, data, headers, ...rest }) => {
        // Special case for the admin panel
        const dataWithClientSecret =
            CLIENT_SECRET && addClientSecret.includes(url) ? { ...data, ClientSecret: CLIENT_SECRET } : data;
        return xhr({
            url: /^https?:\/\//.test(url) ? url : `${API_URL}/${url}`,
            data: dataWithClientSecret,
            headers: {
                ...defaultHeaders,
                ...authHeaders,
                ...headers,
            },
            ...rest,
        });
    };

    Object.defineProperties(cb, {
        UID: {
            set(value) {
                authHeaders = value ? getUIDHeaders(value) : undefined;
            },
        },
    });

    return cb;
};

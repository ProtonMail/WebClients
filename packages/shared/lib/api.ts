import { ApiRateLimiter } from './api/apiRateLimiter';
import { getAppVersionHeaders, getUIDHeaders } from './fetch/headers';
import type { FetchConfig } from './fetch/interface';

const addClientSecret = ['core/v4/auth', 'core/v4/auth/info', 'auth/v4/sessions'];

/**
 * Create a function that can call the API with the correct parameters.
 * @param {String} API_URL - The base URL of the API
 * @param {String} APP_VERSION - The application version
 * @param {String} CLIENT_SECRET - Optional client secret for authentication on specific endpoints
 * @param {String} UID - The user ID for authentication (optional, used for user-specific headers)
 * @param {String} clientID - The ID of the client
 * @param {Object} defaultHeaders - Default headers to override or extend API requests
 * @param {function} protonFetch - Fetch function to make HTTP requests
 * @return {function}
 */
export function configureApi({
    API_URL,
    APP_VERSION,
    CLIENT_SECRET,
    UID,
    clientID,
    defaultHeaders: otherDefaultHeaders = {},
    protonFetch,
}: {
    API_URL: string;
    APP_VERSION: string;
    CLIENT_SECRET?: string;
    UID?: string;
    clientID: string;
    defaultHeaders: Record<string, string>;
    protonFetch: (config: FetchConfig) => Promise<Response>;
}) {
    let authHeaders = UID ? getUIDHeaders(UID) : undefined;
    const appVersionHeaders = getAppVersionHeaders(clientID, APP_VERSION);
    const apiRateLimiter = new ApiRateLimiter();

    const defaultHeaders = {
        accept: 'application/vnd.protonmail.v1+json',
        ...appVersionHeaders,
        ...otherDefaultHeaders,
    };

    const cb = ({ data, headers, url, ...rest }: { data: any; headers: Record<string, string>; url: string }) => {
        // Special case for the admin panel
        const dataWithClientSecret =
            CLIENT_SECRET && addClientSecret.includes(url) ? { ...data, ClientSecret: CLIENT_SECRET } : data;

        const fullUrl = /^https?:\/\//.test(url) ? url : `${API_URL}/${url}`;

        apiRateLimiter.recordCallOrThrow(fullUrl);

        return protonFetch({
            url: fullUrl,
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
        apiRateLimiter: {
            get() {
                return apiRateLimiter;
            },
        },
        UID: {
            set(value) {
                authHeaders = value ? getUIDHeaders(value) : undefined;
            },
        },
    });

    return cb;
}

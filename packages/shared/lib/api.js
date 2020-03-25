export const getUIDHeaders = (UID) => ({
    'x-pm-uid': UID
});

export const getAuthHeaders = (UID, AccessToken) => ({
    'x-pm-uid': UID,
    Authorization: `Bearer ${AccessToken}`
});

const ADD_CLIENT_SECRET = ['auth', 'auth/info'];

/**
 * Create a function that can call the API with the correct parameters.
 * @param {function} xhr - Fetch function
 * @param {String} [UID] - The UID of the authenticated user, or nothing
 * @param {String} API_URL - The URL to the API
 * @param {String} APP_VERSION - The app version
 * @param {String} CLIENT_ID - The id of the client
 * @param {String} [CLIENT_SECRET] - Optional client secret
 * @param {String} API_VERSION - The version of the api
 * @return {function}
 */
export default ({ xhr, UID, API_URL, APP_VERSION, CLIENT_ID, CLIENT_SECRET, API_VERSION }) => {
    const authHeaders = UID ? getUIDHeaders(UID) : undefined;

    const defaultHeaders = {
        accept: 'application/vnd.protonmail.v1+json',
        'x-pm-appversion': `${CLIENT_ID}_${APP_VERSION}`,
        'x-pm-apiversion': `${API_VERSION}`,
        ...authHeaders
    };

    return ({ url, data, headers, ...rest }) => {
        // Special case for the admin panel
        const dataWithClientSecret =
            CLIENT_SECRET && data && ADD_CLIENT_SECRET.includes(url) ? { ...data, ClientSecret: CLIENT_SECRET } : data;
        return xhr({
            url: /^https?:\/\//.test(url) ? url : `${API_URL}/${url}`,
            data: dataWithClientSecret,
            headers: {
                ...defaultHeaders,
                ...headers
            },
            ...rest
        });
    };
};

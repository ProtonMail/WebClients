export default ({ xhr, authenticationStore, API_URL, APP_VERSION, CLIENT_ID, API_VERSION }) => {
    const defaultHeaders = {
        accept: 'application/vnd.protonmail.v1+json',
        'x-pm-appversion': `${CLIENT_ID}_${APP_VERSION}`,
        'x-pm-apiversion': `${API_VERSION}`
    };

    const getAuthHeaders = (UID) => ({
        'x-pm-uid': UID
    });

    return ({ url, data, headers, ...rest }) => {
        const UID = authenticationStore.getUID();
        const authHeaders = UID ? getAuthHeaders(UID) : undefined;

        return xhr({
            url: `${API_URL}/${url}`,
            data,
            headers: {
                ...defaultHeaders,
                ...authHeaders,
                ...headers
            },
            ...rest
        });
    };
};

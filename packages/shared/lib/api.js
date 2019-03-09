export default ({ xhr, UID, API_URL, APP_VERSION, CLIENT_ID, API_VERSION }) => {
    const authHeaders = UID
        ? {
              'x-pm-uid': UID
          }
        : undefined;
    const defaultHeaders = {
        accept: 'application/vnd.protonmail.v1+json',
        'x-pm-appversion': `${CLIENT_ID}_${APP_VERSION}`,
        'x-pm-apiversion': `${API_VERSION}`,
        ...authHeaders
    };

    return ({ url, data, headers, ...rest }) => {
        return xhr({
            url: `${API_URL}/${url}`,
            data,
            headers: {
                ...defaultHeaders,
                ...headers
            },
            ...rest
        });
    };
};

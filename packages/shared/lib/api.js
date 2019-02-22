import { getError, handleUnauthorized, createRefreshHandler } from './apiHandlers';
import { refresh as refreshApi } from './api/auth';

export default ({ xhr, authenticationStore, onLogout, onError, API_URL, APP_VERSION, CLIENT_ID, API_VERSION }) => {
    const defaultHeaders = {
        accept: 'application/vnd.protonmail.v1+json',
        'x-pm-appversion': `${CLIENT_ID}_${APP_VERSION}`,
        'x-pm-apiversion': `${API_VERSION}`
    };

    const getAuthHeaders = (UID) => ({
        'x-pm-uid': UID
    });

    const call = ({ url, data, headers, ...rest }) => {
        const UID = authenticationStore.getUID();
        const authHeaders = UID ? getAuthHeaders(UID) : undefined;

        // Append the ClientID if it's set as a key.
        const otherData = data && 'ClientID' in data ? {
            ...data,
            ClientID: CLIENT_ID
        } : data;

        return xhr({
            url: `${API_URL}/${url}`,
            data: otherData,
            headers: {
                ...defaultHeaders,
                ...authHeaders,
                ...headers
            },
            ...rest
        })
    };

    const refresh = () => call(refreshApi(CLIENT_ID));

    const refreshHandler = createRefreshHandler(refresh, onLogout);

    return (options) => {
        return call(options)
            .catch((e) => {
                if (handleUnauthorized(e)) {
                    return refreshHandler()
                        .then(() => call(options))
                }

                const res = getError(e);
                if (res) {
                    onError(res);
                }

                throw e;
            });
    };
}

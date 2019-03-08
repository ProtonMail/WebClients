import { getAuthVersionWithFallback } from 'pm-srp';

import { API_CUSTOM_ERROR_CODES } from '../../errors';

const { PASSWORD_WRONG } = API_CUSTOM_ERROR_CODES;

/* @ngInject */
function loginWithFallback(authApi, srp, url) {
    const requestURL = url.build('auth');

    /**
     * Provides authentication with fallback behavior in case the user's auth version is unknown.
     * @param {Object} legacyCredentials
     * @param {Object} [initalAuthInfo] - Optional result from /info call
     * @return {Promise<{result, authVersion: number}>}
     */
    return async (legacyCredentials, initalAuthInfo) => {
        let state = {
            authInfo: initalAuthInfo,
            lastAuthVersion: undefined
        };
        const { Username } = legacyCredentials;

        const data = {
            Username
        };

        do {
            const { authInfo = await authApi.info(Username), lastAuthVersion } = state;

            const { version, done } = getAuthVersionWithFallback(authInfo, Username, lastAuthVersion);

            try {
                // If it's not the last fallback attempt, suppress the wrong password notification from the API.
                const suppress = done ? undefined : { suppress: [PASSWORD_WRONG] };
                const config = {
                    method: 'post',
                    url: requestURL(),
                    data,
                    ...suppress
                };
                const result = await srp.auth(legacyCredentials, config, authInfo, version);
                return {
                    authVersion: version,
                    result
                };
            } catch (e) {
                if (e.data && e.data.Code === PASSWORD_WRONG && !done) {
                    state = {
                        lastAuthVersion: version
                    };
                    continue; // eslint-disable-line
                }
                throw e;
            }
        } while (true); // eslint-disable-line
    };
}

export default loginWithFallback;

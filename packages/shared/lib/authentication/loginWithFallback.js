import { getAuthVersionWithFallback } from 'pm-srp';

import { auth, getInfo, PASSWORD_WRONG_ERROR } from '../api/auth';
import { srpAuth } from '../srp';

/**
 * Provides authentication with fallback behavior in case the user's auth version is unknown.
 * @param {Function} api
 * @param {Object} srp
 * @param {Object} credentials
 * @param {Object} [initalAuthInfo] - Optional result from /info call
 * @return {Promise<{result, authVersion: number}>}
 */
const loginWithFallback = async ({ api, credentials, initalAuthInfo }) => {
    let state = {
        authInfo: initalAuthInfo,
        lastAuthVersion: undefined
    };
    const { username } = credentials;
    const data = { Username: username };

    do {
        const { authInfo = await api(getInfo(username)), lastAuthVersion } = state;

        const { version, done } = getAuthVersionWithFallback(authInfo, username, lastAuthVersion);

        try {
            // If it's not the last fallback attempt, suppress the wrong password notification from the API.
            const suppress = done ? undefined : { suppress: [PASSWORD_WRONG_ERROR] };
            const srpConfig = {
                ...auth(data),
                ...suppress
            };
            const result = await srpAuth({
                api,
                credentials,
                config: srpConfig,
                info: authInfo,
                version
            });
            return {
                authVersion: version,
                result
            };
        } catch (e) {
            if (e.data && e.data.Code === PASSWORD_WRONG_ERROR && !done) {
                state = {
                    lastAuthVersion: version
                };
                continue; // eslint-disable-line
            }
            throw e;
        }
    } while (true); // eslint-disable-line
};

export default loginWithFallback;

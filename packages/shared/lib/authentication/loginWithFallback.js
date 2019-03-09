import { getAuthVersionWithFallback } from 'pm-srp';

import { getInfo, PASSWORD_WRONG_ERROR } from '../api/auth';

/**
 * Provides authentication with fallback behavior in case the user's auth version is unknown.
 * @param {Object} abortController
 * @param {Function} api
 * @param {Object} srp
 * @param {Object} credentials
 * @param {Object} [initalAuthInfo] - Optional result from /info call
 * @return {Promise<{result, authVersion: number}>}
 */
const loginWithFallback = async ({ abortController, api, srp, credentials, initalAuthInfo }) => {
    const requestUrl = '/auth';

    let state = {
        authInfo: initalAuthInfo,
        lastAuthVersion: undefined
    };
    const { username } = credentials;
    const data = { Username: username };

    do {
        const infoConfig = {
            ...getInfo(username),
            signal: abortController.signal
        };
        const { authInfo = await api(infoConfig), lastAuthVersion } = state;

        const { version, done } = getAuthVersionWithFallback(authInfo, username, lastAuthVersion);

        try {
            // If it's not the last fallback attempt, suppress the wrong password notification from the API.
            const suppress = done ? undefined : { suppress: [PASSWORD_WRONG_ERROR] };
            const srpConfig = {
                method: 'post',
                url: requestUrl,
                data,
                signal: abortController.signal,
                ...suppress
            };
            const result = await srp.auth(credentials, srpConfig, authInfo, version);
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

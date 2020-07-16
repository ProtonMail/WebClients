import { getAuthVersionWithFallback } from 'pm-srp';

import { auth, getInfo, PASSWORD_WRONG_ERROR } from '../api/auth';
import { srpAuth } from '../srp';
import { Api } from '../interfaces';
import { AuthResponse, AuthVersion, InfoResponse } from './interface';

/**
 * Provides authentication with fallback behavior in case the user's auth version is unknown.
 */
interface Arguments {
    api: Api;
    credentials: { username: string; password: string };
    initialAuthInfo?: InfoResponse;
}
const loginWithFallback = async ({ api, credentials, initialAuthInfo }: Arguments) => {
    let state: { authInfo?: InfoResponse; lastAuthVersion?: AuthVersion } = {
        authInfo: initialAuthInfo,
        lastAuthVersion: undefined,
    };
    const { username } = credentials;
    const data = { Username: username };

    do {
        const { authInfo = await api<InfoResponse>(getInfo(username)), lastAuthVersion } = state;

        const { version, done }: { version: AuthVersion; done: boolean } = getAuthVersionWithFallback(
            authInfo,
            username,
            lastAuthVersion
        );

        try {
            // If it's not the last fallback attempt, suppress the wrong password notification from the API.
            const suppress = done ? undefined : { suppress: [PASSWORD_WRONG_ERROR] };
            const srpConfig = {
                ...auth(data),
                ...suppress,
            };
            const result = await srpAuth<AuthResponse>({
                api,
                credentials,
                config: srpConfig,
                info: authInfo,
                version,
            });
            return {
                authVersion: version,
                result,
            };
        } catch (e) {
            if (e.data && e.data.Code === PASSWORD_WRONG_ERROR && !done) {
                state = {
                    lastAuthVersion: version,
                };
                continue; // eslint-disable-line
            }
            throw e;
        }
    } while (true); // eslint-disable-line
};

export default loginWithFallback;

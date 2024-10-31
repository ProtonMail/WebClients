import { getAuthVersionWithFallback } from '@proton/srp';

import { PASSWORD_WRONG_ERROR, auth, getInfo } from '../api/auth';
import { endOfTrialIPCCall } from '../desktop/endOfTrialHelpers';
import { API_CUSTOM_ERROR_CODES } from '../errors';
import type { Api } from '../interfaces';
import { srpAuth } from '../srp';
import type { AuthResponse, AuthVersion, ChallengePayload, InfoResponse } from './interface';

/**
 * Provides authentication with fallback behavior in case the user's auth version is unknown.
 */
interface Arguments {
    api: Api;
    credentials: { username: string; password: string };
    initialAuthInfo?: InfoResponse;
    payload?: ChallengePayload;
    persistent: boolean;
}

const loginWithFallback = async ({ api, credentials, initialAuthInfo, payload, persistent }: Arguments) => {
    let state: { authInfo?: InfoResponse; lastAuthVersion?: AuthVersion } = {
        authInfo: initialAuthInfo,
        lastAuthVersion: undefined,
    };
    const { username } = credentials;
    const data = { Username: username, Payload: payload };

    do {
        const { authInfo = await api<InfoResponse>(getInfo({ username })), lastAuthVersion } = state;

        const { version, done } = getAuthVersionWithFallback(authInfo, username, lastAuthVersion);

        try {
            // If it's not the last fallback attempt, suppress the wrong password notification from the API.
            const suppress = done ? undefined : { suppress: [PASSWORD_WRONG_ERROR] };
            const srpConfig = {
                ...auth(data, persistent),
                ...suppress,
            };
            const result = await srpAuth({
                api,
                credentials,
                config: srpConfig,
                info: authInfo,
                version,
            }).then((response): Promise<AuthResponse> => response.json());
            return {
                authVersion: version,
                result,
            };
        } catch (e: any) {
            if (e.data && e.data.Code === API_CUSTOM_ERROR_CODES.INBOX_DESKTOP_TRIAL_END) {
                endOfTrialIPCCall();
            }

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

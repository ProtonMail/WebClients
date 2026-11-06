import { auth, revoke } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import { oauthAuthorizePartner } from '@proton/shared/lib/authentication/fork/oauth2';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import {
    GetActiveSessionType,
    type GetActiveSessionsResult,
    type ResumedSessionResult,
    getActiveSessions,
    maybeResumeSessionByUser,
    persistSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import type { ProtonForkData } from '../actions/forkInterface';
import { clearForkState, saveForkState } from '../fork/persistedForkState';

export interface OAuthPartnersInitiateState {
    type: 'initiate';
    payload: {
        forkData: ProtonForkData;
    };
}

export interface OAuthPartnersCallbackState {
    type: 'callback';
    payload: {
        token: string;
        uid: string;
    };
}

interface OAuthPersistedState {
    uid: string;
}

const oauthKey = 'oauth-partners';

const saveOAuthPersistedState = (state: OAuthPersistedState) => {
    sessionStorage.setItem(oauthKey, JSON.stringify(state));
};

const readOAuthPersistedState = (): OAuthPersistedState | undefined => {
    try {
        const partnerAuthState: OAuthPersistedState = JSON.parse(sessionStorage.getItem(oauthKey) || '');
        sessionStorage.removeItem(oauthKey);
        return partnerAuthState;
    } catch {}
};

/**
 * This function deals with initiating the oauth flow with the API and redirects to it.
 */
const handleInitiate = async ({
    state,
    unauthenticatedApi,
}: {
    state: OAuthPartnersInitiateState;
    unauthenticatedApi: UnauthenticatedApi;
}) => {
    await unauthenticatedApi.startUnAuthFlow();
    const url = await oauthAuthorizePartner({
        api: unauthenticatedApi.apiCallback,
        forkParameters: state.payload.forkData.payload.forkParameters,
    });

    saveForkState(state.payload.forkData);
    const uid = unauthenticatedApi.getUID();
    if (!uid) {
        throw new Error('Unexpected UID');
    }
    saveOAuthPersistedState({ uid });

    window.location.assign(url);
};

/**
 * This function deals with the callback after being redirected back from the API.
 */
const handleCallback = async ({
    state,
    api,
}: {
    state: OAuthPartnersCallbackState;
    api: Api;
}): Promise<
    | { type: 'done'; payload: ResumedSessionResult }
    | {
          type: 'existing-account';
          payload: { sessions: GetActiveSessionsResult; email: string };
      }
> => {
    const oauthPersistedState = readOAuthPersistedState();
    if (!oauthPersistedState) {
        throw new Error('Unexpected oauth state');
    }

    const persistent = true;
    const keyPassword = '';
    const clearKeyPassword = '';
    const trusted = false;

    let authResponse: AuthResponse;
    try {
        authResponse = await api<AuthResponse>(
            withUIDHeaders(oauthPersistedState.uid, auth({ SSOResponseToken: state.payload.token }, persistent))
        );
        clearForkState();
    } catch (e) {
        const { code, details } = getApiError(e);
        if (code === API_CUSTOM_ERROR_CODES.ALREADY_EXISTS) {
            const email: string = details.Email || details.email || '';
            const sessions = await getActiveSessions({ api, email });
            if (sessions.session && sessions.type === GetActiveSessionType.AutoPick) {
                return {
                    type: 'done',
                    payload: sessions.session,
                };
            }
            return {
                type: 'existing-account',
                payload: { sessions, email },
            };
        }
        throw e;
    }

    const user = await getUser(api);

    const resumedSessionResult = await maybeResumeSessionByUser({ api, User: user, options: { source: null } });
    if (resumedSessionResult) {
        await api(revoke()).catch(noop);
        return {
            type: 'done',
            payload: resumedSessionResult,
        };
    }

    const sessionResult = await persistSession({
        ...authResponse,
        clearKeyPassword,
        keyPassword,
        User: user,
        api,
        persistent,
        trusted,
        source: SessionSource.Oauth,
    });

    return {
        type: 'done',
        payload: sessionResult,
    };
};

/**
 * Starts the partner's OAuth flow, which leaves the page, or finishes it once the partner redirects back.
 */
export const handleOAuthPartners = async ({
    state,
    unauthenticatedApi,
}: {
    state: OAuthPartnersInitiateState | OAuthPartnersCallbackState;
    unauthenticatedApi: UnauthenticatedApi;
}) => {
    if (state.type === 'initiate') {
        await handleInitiate({ state, unauthenticatedApi });
        // The page is leaving for the partner
        return new Promise<never>(() => {});
    }
    return handleCallback({ state, api: getSilentApi(unauthenticatedApi.apiCallback) });
};

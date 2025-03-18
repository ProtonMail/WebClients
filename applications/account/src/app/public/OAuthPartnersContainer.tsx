import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { type OnLoginCallback, StandardLoadErrorPage } from '@proton/components';
import type { AuthSession } from '@proton/components/containers/login/interface';
import { auth, revoke } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { ProtonForkData } from '@proton/shared/lib/authentication/fork/interface';
import { oauthAuthorizePartner } from '@proton/shared/lib/authentication/fork/oauth2';
import type { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { maybeResumeSessionByUser, persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { type APP_NAMES } from '@proton/shared/lib/constants';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';
import type { Api, User as tsUser } from '@proton/shared/lib/interfaces';
import type { UnauthenticatedApi } from '@proton/shared/lib/unauthApi/unAuthenticatedApi';
import noop from '@proton/utils/noop';

import { clearForkState, saveForkState } from './persistedForkState';

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

interface Props {
    unauthenticatedApi: UnauthenticatedApi;
    state: OAuthPartnersInitiateState | OAuthPartnersCallbackState;
    loader: ReactNode;
    onLogin: OnLoginCallback;
    toApp?: APP_NAMES;
    productParam: ProductParam;
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
    toApp?: APP_NAMES;
    productParam: ProductParam;
}): Promise<AuthSession> => {
    const oauthPersistedState = readOAuthPersistedState();
    if (!oauthPersistedState) {
        throw new Error('Unexpected oauth state');
    }

    const persistent = true;
    const keyPassword = '';
    const clearKeyPassword = '';
    const trusted = false;

    const authResponse = await api<AuthResponse>(
        withUIDHeaders(oauthPersistedState.uid, auth({ SSOResponseToken: state.payload.token }, persistent))
    );
    clearForkState();

    const user = await api<{ User: tsUser }>(getUser()).then(({ User }) => User);

    const resumedSessionResult = await maybeResumeSessionByUser({ api, User: user, options: { source: null } });
    if (resumedSessionResult) {
        await api(revoke()).catch(noop);
        return {
            data: resumedSessionResult,
            flow: 'login',
        };
    }

    const { clientKey, offlineKey, persistedSession } = await persistSession({
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
        data: {
            ...authResponse,
            keyPassword,
            persistedSession,
            offlineKey,
            clientKey,
            User: user,
            persistent,
            trusted,
        },
        flow: 'login',
    };
};

const OAuthPartnersContainer = ({ toApp, productParam, unauthenticatedApi, state, loader, onLogin }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);

    useEffect(() => {
        const run = async () => {
            if (state.type === 'initiate') {
                return handleInitiate({ state, unauthenticatedApi });
            }

            if (state.type === 'callback') {
                const session = await handleCallback({
                    state,
                    api: unauthenticatedApi.apiCallback,
                    toApp,
                    productParam,
                });
                return onLogin(session);
            }

            throw new Error('Unexpected type');
        };
        run().catch((error) => {
            setError({
                message: getNonEmptyErrorMessage(error),
            });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return loader;
};

export default OAuthPartnersContainer;

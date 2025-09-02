import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { OnLoginCallback } from '@proton/components';
import StandardErrorPage from '@proton/components/containers/app/StandardErrorPage';
import useNotifications from '@proton/components/hooks/useNotifications';
import { auth, revoke } from '@proton/shared/lib/api/auth';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import { SessionSource } from '@proton/shared/lib/authentication/SessionInterface';
import type { ProtonForkData } from '@proton/shared/lib/authentication/fork/interface';
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
import { type APP_NAMES, BRAND_NAME } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import * as sessionStorage from '@proton/shared/lib/helpers/sessionStorage';
import type { Api } from '@proton/shared/lib/interfaces';
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
    onCredentials: (data: { sessions?: GetActiveSessionsResult; email: string }) => void;
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

const OAuthPartnersContainer = ({
    toApp,
    productParam,
    unauthenticatedApi,
    state,
    loader,
    onLogin,
    onCredentials,
}: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const { createNotification } = useNotifications();

    useEffect(() => {
        const run = async () => {
            if (state.type === 'initiate') {
                return handleInitiate({ state, unauthenticatedApi });
            }

            if (state.type === 'callback') {
                const result = await handleCallback({
                    state,
                    api: getSilentApi(unauthenticatedApi.apiCallback),
                    toApp,
                    productParam,
                });
                if (result.type === 'done') {
                    return onLogin({ data: result.payload, flow: 'login' });
                }
                if (result.type === 'existing-account') {
                    const email = result.payload.email ? `<${result.payload.email}>` : '';
                    createNotification({
                        type: 'info',
                        text: c('sso')
                            .t`The email address ${email} already exists in ${BRAND_NAME}. Sign in with your ${BRAND_NAME} credentials to continue.`,
                    });
                    return onCredentials(result.payload);
                }
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
        return (
            <StandardErrorPage>
                <div className="text-center">
                    <div className="mb-4">{error.message}</div>
                    <Button color="norm" onClick={() => onCredentials({ email: '' })}>
                        {c('Action').t`Sign in with ${BRAND_NAME}`}
                    </Button>
                </div>
            </StandardErrorPage>
        );
    }

    return loader;
};

export default OAuthPartnersContainer;

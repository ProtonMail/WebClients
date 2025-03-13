import type { OAuthClientInfo } from '@proton/shared/lib/api/oauth';
import { getOAuthClientInfo } from '@proton/shared/lib/api/oauth';
import { getEmailSessionForkSearchParameter } from '@proton/shared/lib/authentication/fork';
import { type OAuthData, type OAuthForkData, SSOType } from '@proton/shared/lib/authentication/fork/interface';
import {
    GetActiveSessionType,
    type GetActiveSessionsResult,
    getActiveSessions,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import type { Api } from '@proton/shared/lib/interfaces';

import { getProduceForkLoginResult } from '../actions/getProduceForkLoginResult';
import type { LoginResult } from '../actions/interface';
import type { Paths } from '../helper';

type OAuthForkResult =
    | { type: 'invalid' }
    | { type: 'login'; payload: LoginResult }
    | { type: 'switch'; payload: { fork: OAuthForkData; activeSessionsResult: GetActiveSessionsResult } };

const getProduceOAuthForkParameters = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const clientID = searchParams.get('ClientID') || '';
    const oaSession = searchParams.get('OaSession') || '';
    const email = getEmailSessionForkSearchParameter(searchParams);

    return {
        clientID,
        oaSession,
        email,
    };
};

export const handleOAuthFork = async ({ api, paths }: { api: Api; paths: Paths }): Promise<OAuthForkResult> => {
    const { clientID, oaSession, email } = getProduceOAuthForkParameters();
    if (!clientID || !oaSession) {
        return {
            type: 'invalid',
        };
    }

    const [activeSessionsResult, { Info }] = await Promise.all([
        getActiveSessions({ api, email }),
        api<{ Info: OAuthClientInfo }>(getOAuthClientInfo(clientID)),
    ]);

    const oauthData: OAuthData = {
        clientInfo: Info,
        clientID,
        oaSession,
    };

    const { session, type } = activeSessionsResult;

    if (type === GetActiveSessionType.AutoPick) {
        const loginResult = await getProduceForkLoginResult({
            api,
            session,
            data: { type: SSOType.OAuth, payload: { oauthData } },
            paths,
        });
        return { type: 'login', payload: loginResult };
    }

    return {
        type: 'switch',
        payload: {
            fork: {
                type: SSOType.OAuth,
                payload: { oauthData },
            },
            activeSessionsResult,
        },
    };
};

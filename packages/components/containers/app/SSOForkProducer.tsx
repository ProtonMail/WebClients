import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { OnLoginCallbackResult } from '@proton/components/containers/app/interface';
import type { AuthSession } from '@proton/components/containers/login/interface';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi, getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { OAuthClientInfo } from '@proton/shared/lib/api/oauth';
import { getOAuthClientInfo } from '@proton/shared/lib/api/oauth';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import type { OAuthProduceForkParameters, ProduceForkParametersFull } from '@proton/shared/lib/authentication/fork';
import {
    getEmailSessionForkSearchParameter,
    getProduceForkParameters,
    getRequiredForkParameters,
    getShouldReAuth,
} from '@proton/shared/lib/authentication/fork';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    GetActiveSessionType,
    getActiveLocalSession,
    getActiveSessions,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';

import { useApi, useErrorHandler } from '../../hooks';
import StandardLoadErrorPage from './StandardLoadErrorPage';

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

export enum SSOType {
    OAuth,
    Proton,
}

export type OAuthData = OAuthProduceForkParameters & {
    clientInfo: OAuthClientInfo;
};

export type ProtonForkData = {
    type: SSOType.Proton;
    payload: {
        forkParameters: ProduceForkParametersFull;
        searchParameters?: URLSearchParams;
    };
};

export type OAuthForkData = {
    type: SSOType.OAuth;
    payload: {
        oauthData: OAuthData;
    };
};

export type ProduceForkData = OAuthForkData | ProtonForkData;

interface Props {
    type: SSOType;
    onActiveSessions: (
        data: ProduceForkData,
        activeSessions: GetActiveSessionsResult
    ) => Promise<OnLoginCallbackResult>;
    onInvalidFork: () => void;
    onProduceFork: (data: ProduceForkData, session: AuthSession) => Promise<OnLoginCallbackResult>;
    loader: ReactNode;
}

const SSOForkProducer = ({ loader, type, onActiveSessions, onInvalidFork, onProduceFork }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const silentApi = getSilentApi(normalApi);

        const runOAuth = async () => {
            const { clientID, oaSession, email } = getProduceOAuthForkParameters();
            if (!clientID || !oaSession) {
                onInvalidFork();
                return;
            }

            const [activeSessionsResult, { Info }] = await Promise.all([
                getActiveSessions({ api: silentApi, email }),
                silentApi<{ Info: OAuthClientInfo }>(getOAuthClientInfo(clientID)),
            ]);

            const oauthData: OAuthData = {
                clientInfo: Info,
                clientID,
                oaSession,
            };

            const { session, type } = activeSessionsResult;

            if (type === GetActiveSessionType.AutoPick) {
                await onProduceFork(
                    {
                        type: SSOType.OAuth,
                        payload: { oauthData },
                    },
                    session
                );
                return;
            }

            await onActiveSessions({ type: SSOType.OAuth, payload: { oauthData } }, activeSessionsResult);
            return;
        };

        const runInternal = async () => {
            const searchParams = new URLSearchParams(window.location.search);
            const forkParameters = getProduceForkParameters(searchParams);
            if (!getRequiredForkParameters(forkParameters)) {
                onInvalidFork();
                return;
            }

            const handleActiveSessions = async (activeSessionsResult: GetActiveSessionsResult) => {
                return onActiveSessions({ type: SSOType.Proton, payload: { forkParameters } }, activeSessionsResult);
            };

            const handleProduceFork = async (session: AuthSession) => {
                return onProduceFork({ type: SSOType.Proton, payload: { forkParameters } }, session);
            };

            const localID = forkParameters.localID;
            if (localID === undefined) {
                const activeSessionsResult = await getActiveSessions({ api: silentApi, email: forkParameters.email });
                await handleActiveSessions(activeSessionsResult);
                return;
            }

            try {
                // Resume session and produce the fork
                const session = await resumeSession({ api: silentApi, localID });

                if (getShouldReAuth(forkParameters, session)) {
                    const sessions = await getActiveLocalSession(getUIDApi(session.UID, silentApi));
                    const activeSessionsResult = { session, sessions, type: GetActiveSessionType.AutoPick };
                    await handleActiveSessions(activeSessionsResult);
                    return;
                }

                await handleProduceFork(session);
            } catch (e: any) {
                if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                    const activeSessionsResult = await getActiveSessions({
                        api: silentApi,
                        email: forkParameters.email,
                        localID,
                    });
                    await handleActiveSessions(activeSessionsResult);
                    return;
                }
                throw e;
            }
        };

        (type === SSOType.Proton ? runInternal() : runOAuth()).catch((e) => {
            errorHandler(e);
            setError({ message: getApiErrorMessage(e) });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return <>{loader}</>;
};

export default SSOForkProducer;

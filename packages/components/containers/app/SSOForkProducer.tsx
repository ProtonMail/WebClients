import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { getApiError, getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { OAuthClientInfo, getOAuthClientInfo } from '@proton/shared/lib/api/oauth';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    GetActiveSessionsResult,
    getActiveSessions,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    OAuthProduceForkParameters,
    ProduceForkParameters,
    getProduceForkParameters,
} from '@proton/shared/lib/authentication/sessionForking';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { Href } from '../../components';
import { useApi, useErrorHandler } from '../../hooks';
import LoaderPage from './LoaderPage';
import StandardErrorPage from './StandardErrorPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';

const getProduceOAuthForkParameters = () => {
    const searchParams = new URLSearchParams(window.location.search);
    const clientID = searchParams.get('ClientID') || '';
    const oaSession = searchParams.get('OaSession') || '';

    return {
        clientID,
        oaSession,
    };
};

export enum SSOType {
    OAuth,
    Proton,
}

export type OAuthData = OAuthProduceForkParameters & {
    clientInfo: OAuthClientInfo;
};

export type ActiveSessionData =
    | {
          type: SSOType.Proton;
          payload: ProduceForkParameters;
      }
    | {
          type: SSOType.OAuth;
          payload: OAuthData;
      };

export type ProduceForkData =
    | {
          type: SSOType.Proton;
          payload: ProduceForkParameters & { UID: string; keyPassword?: string; persistent: boolean; trusted: boolean };
      }
    | {
          type: SSOType.OAuth;
          payload: OAuthData & { UID: string };
      };

interface Props {
    type: SSOType;
    onActiveSessions: (data: ActiveSessionData, activeSessions: GetActiveSessionsResult) => void;
    onInvalidFork: () => void;
    onProduceFork: (data: ProduceForkData) => Promise<void>;
}

const SSOForkProducer = ({ type, onActiveSessions, onInvalidFork, onProduceFork }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [tooManyChildSessionsError, setTooManyChildSessionsError] = useState<boolean>(false);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const runOAuth = async () => {
            const { clientID, oaSession } = getProduceOAuthForkParameters();
            if (!clientID || !oaSession) {
                onInvalidFork();
                return;
            }

            const [activeSessionsResult, { Info }] = await Promise.all([
                getActiveSessions(silentApi),
                silentApi<{ Info: OAuthClientInfo }>(getOAuthClientInfo(clientID)),
            ]);
            const { session, sessions } = activeSessionsResult;

            if (session && sessions.length === 1) {
                const { UID } = session;

                await onProduceFork({
                    type: SSOType.OAuth,
                    payload: {
                        UID,
                        clientInfo: Info,
                        clientID,
                        oaSession,
                    },
                });
                return;
            }

            onActiveSessions(
                {
                    type: SSOType.OAuth,
                    payload: {
                        clientInfo: Info,
                        clientID,
                        oaSession,
                    },
                },
                activeSessionsResult
            );
            return;
        };

        const runInternal = async () => {
            const { app, state, localID, type, plan } = getProduceForkParameters();
            if (!app || !state) {
                onInvalidFork();
                return;
            }

            const handleActiveSessions = async (activeSessionsResult: GetActiveSessionsResult) => {
                const { session, sessions } = activeSessionsResult;

                if (session && sessions.length === 1 && type !== FORK_TYPE.SWITCH) {
                    const { UID, keyPassword, persistent, trusted } = session;
                    await onProduceFork({
                        type: SSOType.Proton,
                        payload: {
                            UID,
                            keyPassword,
                            state,
                            app,
                            plan,
                            persistent,
                            trusted,
                        },
                    });
                    return;
                }

                onActiveSessions({ type: SSOType.Proton, payload: { state, app, type, plan } }, activeSessionsResult);
            };

            if (localID === undefined) {
                const activeSessionsResult = await getActiveSessions(silentApi);
                await handleActiveSessions(activeSessionsResult);
                return;
            }

            try {
                // Resume session and produce the fork
                const validatedSession = await resumeSession(silentApi, localID);
                await onProduceFork({
                    type: SSOType.Proton,
                    payload: {
                        keyPassword: validatedSession.keyPassword,
                        UID: validatedSession.UID,
                        state,
                        app,
                        plan,
                        persistent: validatedSession.persistent,
                        trusted: validatedSession.trusted,
                    },
                });
            } catch (e: any) {
                if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                    const activeSessionsResult = await getActiveSessions(silentApi);
                    await handleActiveSessions(activeSessionsResult);
                    return;
                }
                throw e;
            }
        };

        (type === SSOType.Proton ? runInternal() : runOAuth()).catch((e) => {
            const { code } = getApiError(error);
            if (code === API_CUSTOM_ERROR_CODES.TOO_MANY_CHILDREN) {
                setTooManyChildSessionsError(true);
                return;
            }

            errorHandler(e);
            setError({
                message: getApiErrorMessage(e),
            });
        });
    }, []);

    if (tooManyChildSessionsError) {
        return (
            <StandardErrorPage>
                {c('Error message').jt`Too many child sessions, please clear your cookies and sign back in.`}
                <Href href={getKnowledgeBaseUrl('/how-to-clean-cache-and-cookies')}>{c('Info').t`More Info`}</Href>
            </StandardErrorPage>
        );
    }

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return <LoaderPage />;
};

export default SSOForkProducer;

import { useEffect, useState } from 'react';
import { c } from 'ttag';
import {
    getActiveSessions,
    GetActiveSessionsResult,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    getProduceForkParameters,
    OAuthProduceForkParameters,
    ProduceForkParameters,
} from '@proton/shared/lib/authentication/sessionForking';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { getApiError, getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getOAuthClientInfo, OAuthClientInfo } from '@proton/shared/lib/api/oauth';

import { useApi, useErrorHandler } from '../../hooks';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import StandardErrorPage from './StandardErrorPage';
import { Href } from '../../components';

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
    oauth,
    internal,
}

export type OAuthData = OAuthProduceForkParameters & {
    clientInfo: OAuthClientInfo;
};

export type ActiveSessionData =
    | {
          type: SSOType.internal;
          payload: ProduceForkParameters;
      }
    | {
          type: SSOType.oauth;
          payload: OAuthData;
      };

export type ProduceForkData =
    | {
          type: SSOType.internal;
          payload: ProduceForkParameters & { UID: string; keyPassword?: string; persistent: boolean };
      }
    | {
          type: SSOType.oauth;
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
                    type: SSOType.oauth,
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
                    type: SSOType.oauth,
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
            const { app, state, localID, type } = getProduceForkParameters();
            if (!app || !state) {
                onInvalidFork();
                return;
            }

            const handleActiveSessions = async (activeSessionsResult: GetActiveSessionsResult) => {
                const { session, sessions } = activeSessionsResult;

                if (session && sessions.length === 1 && type !== FORK_TYPE.SWITCH) {
                    const { UID, keyPassword, persistent } = session;
                    await onProduceFork({
                        type: SSOType.internal,
                        payload: {
                            UID,
                            keyPassword,
                            state,
                            app,
                            persistent,
                        },
                    });
                    return;
                }

                onActiveSessions({ type: SSOType.internal, payload: { state, app, type } }, activeSessionsResult);
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
                    type: SSOType.internal,
                    payload: {
                        keyPassword: validatedSession.keyPassword,
                        UID: validatedSession.UID,
                        state,
                        app,
                        persistent: validatedSession.persistent,
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

        (type === SSOType.internal ? runInternal() : runOAuth()).catch((e) => {
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
                <Href href="https://protonmail.com/support/knowledge-base/how-to-clean-cache-and-cookies/">{c('Info')
                    .t`More Info`}</Href>
            </StandardErrorPage>
        );
    }

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return <LoaderPage />;
};

export default SSOForkProducer;

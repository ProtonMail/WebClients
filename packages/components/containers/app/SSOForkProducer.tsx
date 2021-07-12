import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import {
    getActiveSessions,
    GetActiveSessionsResult,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import {
    getProduceForkParameters,
    produceFork,
    ProduceForkParameters,
} from '@proton/shared/lib/authentication/sessionForking';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    getApiErrorMessage,
    getIs401Error,
    getIsTooManyChildSessionsError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';

import { useApi, useErrorHandler } from '../../hooks';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import StandardErrorPage from './StandardErrorPage';
import { Href } from '../../components';

interface Props {
    onActiveSessions: (data: ProduceForkParameters, activeSessions: GetActiveSessionsResult) => void;
    onInvalidFork: () => void;
}

const SSOForkProducer = ({ onActiveSessions, onInvalidFork }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [tooManyChildSessionsError, setTooManyChildSessionsError] = useState<boolean>(false);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const run = async () => {
            const { app, state, localID, type } = getProduceForkParameters();
            if (!app || !state) {
                onInvalidFork();
                return;
            }

            const handleActiveSessions = async (activeSessionsResult: GetActiveSessionsResult) => {
                const { session, sessions } = activeSessionsResult;

                if (session && sessions.length === 1 && type !== FORK_TYPE.SWITCH) {
                    const { UID, keyPassword } = session;
                    await produceFork({
                        api: silentApi,
                        UID,
                        keyPassword,
                        state,
                        app,
                    });
                    return;
                }

                onActiveSessions({ state, app, type }, activeSessionsResult);
            };

            if (localID === undefined) {
                const activeSessionsResult = await getActiveSessions(silentApi);
                await handleActiveSessions(activeSessionsResult);
                return;
            }

            try {
                // Resume session and produce the fork
                const validatedSession = await resumeSession(silentApi, localID);
                await produceFork({
                    api: silentApi,
                    keyPassword: validatedSession.keyPassword,
                    UID: validatedSession.UID,
                    state,
                    app,
                });
            } catch (e) {
                if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                    const activeSessionsResult = await getActiveSessions(silentApi);
                    await handleActiveSessions(activeSessionsResult);
                    return;
                }
                throw e;
            }
        };
        run().catch((e) => {
            const isTooManyChildSessionsError = getIsTooManyChildSessionsError(e);
            if (isTooManyChildSessionsError) {
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

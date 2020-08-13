import React, { useEffect, useState } from 'react';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import {
    getActiveSessions,
    GetActiveSessionsResult,
    resumeSession,
} from 'proton-shared/lib/authentication/persistedSessionHelper';
import {
    getProduceForkParameters,
    produceFork,
    ProduceForkParameters,
} from 'proton-shared/lib/authentication/sessionForking';
import { InvalidPersistentSessionError } from 'proton-shared/lib/authentication/error';
import { getApiErrorMessage, getIs401Error } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { useApi, useNotifications } from '../../hooks';
import LoaderPage from './LoaderPage';
import ModalsChildren from '../modals/Children';
import StandardLoadError from './StandardLoadError';

interface Props {
    onActiveSessions: (data: ProduceForkParameters, activeSessions: GetActiveSessionsResult) => void;
    onInvalidFork: () => void;
}

const SSOForkProducer = ({ onActiveSessions, onInvalidFork }: Props) => {
    const [error, setError] = useState<Error | undefined>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();

    useEffect(() => {
        const run = async () => {
            const { app, state, localID, type } = getProduceForkParameters();
            if (!app || !state) {
                onInvalidFork();
                return;
            }
            await loadOpenPGP();
            if (localID === undefined) {
                const activeSessionsResult = await getActiveSessions(silentApi);
                return onActiveSessions({ app, state, type }, activeSessionsResult);
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
                    onActiveSessions({ app, state, type }, activeSessionsResult);
                    return;
                }
                throw e;
            }
        };
        run().catch((e) => {
            const errorMessage = getApiErrorMessage(e) || 'Unknown error';
            createNotification({ type: 'error', text: errorMessage });
            console.error(error);
            setError(e);
        });
    }, []);

    if (error) {
        return <StandardLoadError />;
    }

    return (
        <>
            <LoaderPage />
            <ModalsChildren />
        </>
    );
};

export default SSOForkProducer;

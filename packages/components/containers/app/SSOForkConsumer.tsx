import React, { useEffect, useState } from 'react';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { InvalidForkConsumeError } from 'proton-shared/lib/authentication/error';
import { consumeFork, getConsumeForkParameters } from 'proton-shared/lib/authentication/sessionForking';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import { traceError } from 'proton-shared/lib/helpers/sentry';

import { useApi, useNotifications } from '../../hooks';
import { ProtonLoginCallback } from './interface';
import StandardLoadError from './StandardLoadError';
import { ModalsChildren } from '../modals';
import LoaderPage from './LoaderPage';

interface Props {
    onLogin: ProtonLoginCallback;
    onEmptyFork: () => void;
    onInvalidFork: () => void;
}

const SSOForkConsumer = ({ onLogin, onEmptyFork, onInvalidFork }: Props) => {
    const [error, setError] = useState<Error | undefined>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();

    useEffect(() => {
        const run = async () => {
            const { state, selector, sessionKey } = getConsumeForkParameters();
            if (!state && !selector && !sessionKey) {
                return onEmptyFork();
            }
            if (!state || !selector || !sessionKey) {
                return onInvalidFork();
            }
            await loadOpenPGP();
            try {
                const authResponse = await consumeFork({ selector, api: silentApi, state, sessionKey });
                return onLogin(authResponse);
            } catch (e) {
                if (e instanceof InvalidForkConsumeError) {
                    return onInvalidFork();
                }
                throw e;
            }
        };

        run().catch((e) => {
            const errorMessage = getApiErrorMessage(e) || 'Unknown error';
            createNotification({ type: 'error', text: errorMessage });
            traceError(e);
            console.error(e);
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

export default SSOForkConsumer;

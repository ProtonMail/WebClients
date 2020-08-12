import React, { useEffect, useState } from 'react';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { InvalidForkConsumeError } from 'proton-shared/lib/authentication/error';
import { consumeFork, getConsumeForkParameters } from 'proton-shared/lib/authentication/sessionForking';
import { persistSession } from 'proton-shared/lib/authentication/persistedSessionHelper';
import { getApiErrorMessage } from 'proton-shared/lib/api/helpers/apiErrorHelper';
import {
    LoaderPage,
    ModalsChildren,
    useApi,
    useNotifications,
    StandardLoadError,
    ProtonLoginCallback,
} from '../../index';

interface Props {
    onLogin: ProtonLoginCallback;
    onInvalidFork: () => void;
}

const SSOForkConsumer = ({ onLogin, onInvalidFork }: Props) => {
    const [error, setError] = useState<Error | undefined>();
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const { createNotification } = useNotifications();

    useEffect(() => {
        const run = async () => {
            const { state, selector, sessionKey } = getConsumeForkParameters();
            if (!state || !selector || !sessionKey) {
                return onInvalidFork();
            }
            await loadOpenPGP();
            try {
                const authResponse = await consumeFork({ selector, api: silentApi, state, sessionKey });
                if (authResponse.AccessToken) {
                    await persistSession({ api: silentApi, ...authResponse });
                }
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

export default SSOForkConsumer;

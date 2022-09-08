import { useEffect, useState } from 'react';

import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InvalidForkConsumeError } from '@proton/shared/lib/authentication/error';
import {
    consumeFork,
    getConsumeForkParameters,
    removeHashParameters,
} from '@proton/shared/lib/authentication/sessionForking';

import { useApi, useErrorHandler } from '../../hooks';
import { ModalsChildren } from '../modals';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import { ProtonLoginCallback } from './interface';

interface Props {
    onLogin: ProtonLoginCallback;
    onEmptyFork: () => void;
    onInvalidFork: () => void;
}

const SSOForkConsumer = ({ onLogin, onEmptyFork, onInvalidFork }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const run = async () => {
            const { state, selector, key, persistent, trusted } = getConsumeForkParameters();
            if (!state && !selector && !key) {
                return onEmptyFork();
            }
            if (!state || !selector || !key) {
                return onInvalidFork();
            }
            try {
                const result = await consumeFork({ selector, api: silentApi, state, key, persistent, trusted });
                onLogin(result);
                return;
            } catch (e: any) {
                if (e instanceof InvalidForkConsumeError) {
                    return onInvalidFork();
                }

                removeHashParameters();

                throw e;
            }
        };

        run().catch((e) => {
            errorHandler(e);
            setError({
                message: getApiErrorMessage(e),
            });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return (
        <>
            <LoaderPage />
            <ModalsChildren />
        </>
    );
};

export default SSOForkConsumer;

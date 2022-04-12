import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { useApi } from '../../hooks';
import LoaderPage from './LoaderPage';
import ModalsChildren from '../modals/Children';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import { ProtonLoginCallback } from './interface';
import { wrapUnloadError } from './errorRefresh';

interface Props {
    onLogin: ProtonLoginCallback;
    onInactiveSession: (localID?: number) => void;
}

const SSOPublicApp = ({ onLogin, onInactiveSession }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const run = async () => {
            const localID = getLocalIDFromPathname(window.location.pathname);
            if (localID === undefined) {
                return onInactiveSession(undefined);
            }
            try {
                const result = await resumeSession(silentApi, localID);
                onLogin(result);
                return;
            } catch (e: any) {
                if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                    return onInactiveSession(localID);
                }
                throw e;
            }
        };
        wrapUnloadError(run()).catch((error) => {
            setError({
                message: getApiErrorMessage(error) || error?.message || c('Error').t`Unknown error`,
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

export default SSOPublicApp;

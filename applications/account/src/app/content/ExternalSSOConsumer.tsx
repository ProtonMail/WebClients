import { ReactNode, useEffect, useState } from 'react';

import { ModalsChildren, OnLoginCallback } from '@proton/components/containers';
import StandardLoadErrorPage from '@proton/components/containers/app/StandardLoadErrorPage';
import { useApi, useErrorHandler } from '@proton/components/hooks';
import { auth } from '@proton/shared/lib/api/auth';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getUIDApi } from '@proton/shared/lib/api/helpers/customConfig';
import { getUser } from '@proton/shared/lib/api/user';
import { AuthResponse } from '@proton/shared/lib/authentication/interface';
import { persistSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import { User } from '@proton/shared/lib/interfaces';

interface Props {
    loader: ReactNode;
    onLogin: OnLoginCallback;
}

const ExternalSSOConsumer = ({ loader, onLogin }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });
    const errorHandler = useErrorHandler();

    useEffect(() => {
        const run = async () => {
            const hashParams = new URLSearchParams(window.location.hash.slice(1));
            const token = hashParams.get('token') || '';
            const uid = hashParams.get('uid') || '';

            if (!token) {
                setError({ message: 'Missing SSO parameters' });
                return;
            }

            const persistent = false;
            const trusted = false;
            const keyPassword = '';
            const loginPassword = '';

            const uidApi = uid ? getUIDApi(uid, silentApi) : silentApi;

            const authResponse = await uidApi<AuthResponse>(auth({ SSOResponseToken: token }, persistent));
            const user = await uidApi<{ User: User }>(getUser()).then(({ User }) => User);

            const result = {
                ...authResponse,
                keyPassword,
                loginPassword,
                persistent,
                trusted,
                User: user,
            };

            await persistSession({ ...result, api: uidApi });
            await onLogin({
                ...result,
                appIntent: { app: APPS.PROTONVPN_SETTINGS },
                flow: 'login',
            });
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
            {loader}
            <ModalsChildren />
        </>
    );
};

export default ExternalSSOConsumer;

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type * as H from 'history';

import { loadLocalesPublicApp } from '@proton/account/bootstrap';
import type { OnLoginCallbackResult, ProtonLoginCallback } from '@proton/components';
import { StandardLoadErrorPage, useApi } from '@proton/components';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import {
    getEmailSessionForkSearchParameter,
    getLocalIDForkSearchParameter,
} from '@proton/shared/lib/authentication/fork';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

interface Props {
    location: H.Location;
    locales?: TtagLocaleMap;
    children: ReactNode;
    onActiveSessions: (data: GetActiveSessionsResult) => Promise<OnLoginCallbackResult>;
    onLogin: ProtonLoginCallback;
    loader: ReactNode;
    pathLocale: string;
    onPreload: () => void;
}

const AccountPublicApp = ({
    pathLocale,
    loader,
    location,
    locales = {},
    children,
    onPreload,
    onActiveSessions,
}: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const run = async () => {
            const searchParams = new URLSearchParams(location.search);

            const publicAppPromise = loadLocalesPublicApp({
                app: APPS.PROTONACCOUNT,
                locales,
                searchParams,
                pathLocale,
            });

            onPreload?.();

            const sessionsPromise = (async () => {
                const activeSessionsResult = await getActiveSessions({
                    api: silentApi,
                    localID: getLocalIDForkSearchParameter(searchParams),
                    email: getEmailSessionForkSearchParameter(searchParams),
                });
                return onActiveSessions(activeSessionsResult);
            })();

            await Promise.all([sessionsPromise, publicAppPromise]).then(([activeSessions]) => {
                if (activeSessions.state !== 'complete') {
                    setLoading(false);
                }
            });
        };

        wrapUnloadError(run()).catch((error) => {
            setError({
                message: getNonEmptyErrorMessage(error),
            });
        });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading) {
        return <>{loader}</>;
    }

    return <>{children}</>;
};

export default AccountPublicApp;

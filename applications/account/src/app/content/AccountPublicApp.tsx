import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type * as H from 'history';

import { publicApp } from '@proton/account/bootstrap';
import type { OnLoginCallbackResult, ProtonLoginCallback } from '@proton/components';
import { StandardLoadErrorPage, useApi } from '@proton/components';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import {
    getEmailSessionForkSearchParameter,
    getLocalIDForkSearchParameter,
} from '@proton/shared/lib/authentication/fork';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { GetActiveSessionsResult } from '@proton/shared/lib/authentication/persistedSessionHelper';
import { getActiveSessions, resumeSession } from '@proton/shared/lib/authentication/persistedSessionHelper';
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
}

const AccountPublicApp = ({
    pathLocale,
    loader,
    location,
    locales = {},
    children,
    onActiveSessions,
    onLogin,
}: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const runGetSessions = async () => {
            const searchParams = new URLSearchParams(location.search);
            await publicApp({ app: APPS.PROTONACCOUNT, locales, searchParams, pathLocale });
            const activeSessionsResult = await getActiveSessions({
                api: silentApi,
                localID: getLocalIDForkSearchParameter(searchParams),
                email: getEmailSessionForkSearchParameter(searchParams),
            });
            const activeSessions = await onActiveSessions(activeSessionsResult);
            if (activeSessions.state !== 'complete') {
                setLoading(false);
            }
        };

        const runResumeSession = async (localID: number) => {
            try {
                const result = await resumeSession({ api: silentApi, localID });
                return onLogin(result);
            } catch (e: any) {
                if (e instanceof InvalidPersistentSessionError || getIs401Error(e)) {
                    return runGetSessions();
                }
                throw e;
            }
        };

        const run = async () => {
            const localID = getLocalIDFromPathname(location.pathname);
            if (localID === undefined) {
                return runGetSessions();
            }
            return runResumeSession(localID);
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

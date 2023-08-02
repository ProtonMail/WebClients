import { ReactNode, useEffect, useState } from 'react';

import * as H from 'history';
import { c } from 'ttag';

import { ProtonLoginCallback, StandardLoadErrorPage, useApi } from '@proton/components';
import { getCryptoWorkerOptions } from '@proton/components/containers/app/cryptoWorkerOptions';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import {
    GetActiveSessionsResult,
    getActiveSessions,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { APPS, DEFAULT_LOCALE } from '@proton/shared/lib/constants';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

interface Props {
    location: H.Location;
    locales?: TtagLocaleMap;
    children: ReactNode;
    onActiveSessions: (data: GetActiveSessionsResult) => boolean;
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
            const languageParams = searchParams.get('language');
            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleMatch(pathLocale || languageParams || '', locales) || DEFAULT_LOCALE;
            await Promise.all([
                loadCryptoWorker(getCryptoWorkerOptions(APPS.PROTONACCOUNT)),
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale),
            ]);
            const activeSessionsResult = await getActiveSessions(silentApi);
            if (!onActiveSessions(activeSessionsResult)) {
                setLoading(false);
            }
        };

        const runResumeSession = async (localID: number) => {
            try {
                const result = await resumeSession(silentApi, localID);
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
                message: getApiErrorMessage(error) || error?.message || c('Error').t`Unknown error`,
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

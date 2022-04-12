import { c } from 'ttag';
import { useEffect, useState } from 'react';
import * as React from 'react';
import { loadOpenPGP } from '@proton/shared/lib/openpgp';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadLocale, loadDateLocale } from '@proton/shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';
import { LoaderPage, useApi, ProtonLoginCallback, StandardLoadErrorPage } from '@proton/components';
import {
    getActiveSessions,
    GetActiveSessionsResult,
    resumeSession,
} from '@proton/shared/lib/authentication/persistedSessionHelper';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { InvalidPersistentSessionError } from '@proton/shared/lib/authentication/error';
import { getApiErrorMessage, getIs401Error } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import * as H from 'history';

interface Props {
    location: H.Location;
    locales?: TtagLocaleMap;
    children: React.ReactNode;
    onActiveSessions: (data: GetActiveSessionsResult) => boolean;
    onLogin: ProtonLoginCallback;
}

const AccountPublicApp = ({ location, locales = {}, children, onActiveSessions, onLogin }: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const normalApi = useApi();
    const silentApi = <T,>(config: any) => normalApi<T>({ ...config, silence: true });

    useEffect(() => {
        const runGetSessions = async () => {
            const searchParams = new URLSearchParams(location.search);
            const languageParams = searchParams.get('language');
            const languageCookie = getCookie('Locale');
            const browserLocale = getBrowserLocale();
            const localeCode =
                getClosestLocaleMatch(languageParams || languageCookie || '', locales) ||
                getClosestLocaleCode(browserLocale, locales);
            await Promise.all([
                loadOpenPGP(),
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
        return <LoaderPage />;
    }

    return <>{children}</>;
};

export default AccountPublicApp;

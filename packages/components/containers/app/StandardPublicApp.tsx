import { ReactNode, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { getCryptoWorkerOptions } from '@proton/components/containers/app/cryptoWorkerOptions';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import { useConfig } from '../../hooks';
import ModalsChildren from '../modals/Children';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import { wrapUnloadError } from './errorRefresh';

interface Props {
    locales?: TtagLocaleMap;
    children: ReactNode;
}

const StandardPublicApp = ({ locales = {}, children }: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const history = useHistory();

    useEffect(() => {
        const run = () => {
            const searchParams = new URLSearchParams(history.location.search);
            const languageParams = searchParams.get('language');
            const languageCookie = getCookie('Locale');
            const browserLocale = getBrowserLocale();
            const localeCode =
                getClosestLocaleMatch(languageParams || languageCookie || '', locales) ||
                getClosestLocaleCode(browserLocale, locales);
            return Promise.all([
                loadCryptoWorker(getCryptoWorkerOptions(APP_NAME)),
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale),
            ]);
        };
        wrapUnloadError(run())
            .then(() => setLoading(false))
            .catch((error) => {
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

    return (
        <>
            <ModalsChildren />
            {children}
        </>
    );
};

export default StandardPublicApp;

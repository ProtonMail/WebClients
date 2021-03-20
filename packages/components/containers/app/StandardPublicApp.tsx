import React, { useEffect, useState } from 'react';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { loadDateLocale, loadLocale } from 'proton-shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from 'proton-shared/lib/i18n/helper';
import { useHistory } from 'react-router-dom';
import { getCookie } from 'proton-shared/lib/helpers/cookies';

import ModalsChildren from '../modals/Children';
import LoaderPage from './LoaderPage';
import StandardLoadErrorPage from './StandardLoadErrorPage';

interface Props {
    locales?: TtagLocaleMap;
    openpgpConfig?: any;
    children: React.ReactNode;
}

const StandardPublicApp = ({ locales = {}, openpgpConfig, children }: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
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
                loadOpenPGP(openpgpConfig),
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale),
            ]);
        };
        run()
            .then(() => setLoading(false))
            .catch(() => setError(true));
    }, []);

    if (error) {
        return <StandardLoadErrorPage />;
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

import React, { useEffect, useState } from 'react';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { loadDateLocale, loadLocale } from 'proton-shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import { getBrowserLocale, getClosestLocaleCode } from 'proton-shared/lib/i18n/helper';
import GenericError from '../error/GenericError';
import ModalsChildren from '../modals/Children';
import LoaderPage from './LoaderPage';

interface Props {
    locales?: TtagLocaleMap;
    openpgpConfig?: object;
    children: React.ReactNode;
}

const StandardPublicApp = ({ locales = {}, openpgpConfig, children }: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const run = () => {
            const browserLocale = getBrowserLocale();
            const localeCode = getClosestLocaleCode(browserLocale, locales);
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
        return <GenericError />;
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

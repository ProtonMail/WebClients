import React, { useEffect, useState } from 'react';
import { loadOpenPGP } from 'proton-shared/lib/openpgp';
import { getBrowserLocale, getClosestMatches } from 'proton-shared/lib/i18n/helper';
import loadLocale from 'proton-shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from 'proton-shared/lib/interfaces/Locale';
import GenericError from '../error/GenericError';
import LoaderPage from './LoaderPage';
import ModalsChildren from '../modals/Children';

interface Props {
    locales?: TtagLocaleMap;
    openpgpConfig?: object;
    children: React.ReactNode;
}

const StandardPublicApp = ({ locales = {}, openpgpConfig, children }: Props) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const browserLocale = getBrowserLocale();

        (async () => {
            await Promise.all([
                loadOpenPGP(openpgpConfig),
                loadLocale({
                    ...getClosestMatches({ locale: browserLocale, browserLocale, locales }),
                    locales,
                }),
            ]);
        })()
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

import { useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import { initLocales } from '@proton/shared/lib/i18n/locales';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { Href, ModalsChildren, StandardLoadErrorPage, useLoading } from '@proton/components';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import LoaderPage from '@proton/components/containers/app/LoaderPage';

import Layout from 'proton-account/src/app/public/Layout';
import { store } from './logic/store';
import PageContainer from './containers/PageContainer';

const locales = initLocales(require.context('../../locales', true, /.json$/, 'lazy'));

const MainContainer = () => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [loading, withLoading] = useLoading(true);

    useEffect(() => {
        const browserLocale = getBrowserLocale();

        const localeCode = getClosestLocaleCode(browserLocale, locales);

        withLoading(
            Promise.all([loadLocale(localeCode, locales), loadDateLocale(localeCode, browserLocale), loadOpenPGP({})])
        ).catch((e) => setError({ message: getApiErrorMessage(e) }));

        return () => {
            destroyOpenPGP();
        };
    }, []);

    if (error?.message) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    if (loading) {
        return (
            <>
                <ModalsChildren />
                <LoaderPage />
            </>
        );
    }

    const signUpButton = (
        <Href key="terms" className="button button-solid-norm" href="https://protonmail.com/signup">
            {c('Link').t`Sign up for free`}
        </Href>
    );

    return (
        <Layout toApp={APPS.PROTONMAIL} customHeaderActions={signUpButton}>
            <ReduxProvider store={store}>
                <PageContainer />
            </ReduxProvider>
        </Layout>
    );
};

export default MainContainer;

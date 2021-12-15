import { useEffect, useState } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { c } from 'ttag';

import { APPS } from '@proton/shared/lib/constants';
import { getBrowserLocale, getClosestLocaleCode } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { FeaturesProvider, Href, ModalsChildren, StandardLoadErrorPage, useLoading } from '@proton/components';
import { destroyOpenPGP, loadOpenPGP } from '@proton/shared/lib/openpgp';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import LoaderPage from '@proton/components/containers/app/LoaderPage';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import Layout from 'proton-account/src/app/public/Layout';
import { store } from '../../logic/eo/eoStore';
import EOPageContainer from './EOPageContainer';
import FakeEventManagerProvider from './FakeEventManagerProvider';

interface Props {
    locales: TtagLocaleMap;
}

const MainContainer = ({ locales }: Props) => {
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
        <FakeEventManagerProvider>
            <FeaturesProvider>
                <Layout toApp={APPS.PROTONMAIL} customHeaderActions={signUpButton}>
                    <ReduxProvider store={store}>
                        <EOPageContainer />
                    </ReduxProvider>
                </Layout>
                <ModalsChildren />
            </FeaturesProvider>
        </FakeEventManagerProvider>
    );
};

export default MainContainer;

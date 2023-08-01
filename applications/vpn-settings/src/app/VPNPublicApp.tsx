import { ReactNode, useEffect, useState } from 'react';

import * as H from 'history';
import { c } from 'ttag';

import { StandardLoadErrorPage } from '@proton/components';
import { getCryptoWorkerOptions } from '@proton/components/containers/app/cryptoWorkerOptions';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { APPS } from '@proton/shared/lib/constants';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import { loadCryptoWorker } from '@proton/shared/lib/helpers/setupCryptoWorker';
import { getBrowserLocale, getClosestLocaleCode, getClosestLocaleMatch } from '@proton/shared/lib/i18n/helper';
import { loadDateLocale, loadLocale } from '@proton/shared/lib/i18n/loadLocale';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

interface Props {
    location: H.Location;
    locales?: TtagLocaleMap;
    children: ReactNode;
    onLoaded: () => void;
    pathLocale: string;
}

const VPNPublicApp = ({ pathLocale, onLoaded, location, locales = {}, children }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);

    useEffect(() => {
        const run = async () => {
            const searchParams = new URLSearchParams(location.search);
            const languageParams = searchParams.get('language');
            const languageCookie = getCookie('Locale');
            const browserLocale = getBrowserLocale();
            const localeCode =
                getClosestLocaleMatch(pathLocale || languageParams || languageCookie || '', locales) ||
                getClosestLocaleCode(browserLocale, locales);
            await Promise.all([
                loadCryptoWorker(getCryptoWorkerOptions(APPS.PROTONVPN_SETTINGS)),
                loadLocale(localeCode, locales),
                loadDateLocale(localeCode, browserLocale),
            ]);
            onLoaded();
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

    return <>{children}</>;
};

export default VPNPublicApp;

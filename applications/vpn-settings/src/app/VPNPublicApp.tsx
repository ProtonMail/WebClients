import { ReactNode, useEffect, useState } from 'react';

import * as H from 'history';
import { c } from 'ttag';

import { publicApp } from '@proton/account/bootstrap';
import { StandardLoadErrorPage } from '@proton/components';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { APPS } from '@proton/shared/lib/constants';
import { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

interface Props {
    location: H.Location;
    locales?: TtagLocaleMap;
    children: ReactNode;
    loader: ReactNode;
    pathLocale: string;
}

const VPNPublicApp = ({ pathLocale, loader, location, locales = {}, children }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            const searchParams = new URLSearchParams(location.search);
            await publicApp({ app: APPS.PROTONVPN_SETTINGS, pathLocale, searchParams, locales });
            setLoading(false);
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

export default VPNPublicApp;

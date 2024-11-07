import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type * as H from 'history';

import { loadLocalesPublicApp } from '@proton/account/bootstrap';
import { StandardLoadErrorPage } from '@proton/components';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { APPS } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

interface Props {
    location: H.Location;
    locales?: TtagLocaleMap;
    children: ReactNode;
    loader: ReactNode;
    pathLocale: string;
    onPreload: () => void;
}

const VPNPublicApp = ({ pathLocale, loader, location, locales = {}, children, onPreload }: Props) => {
    const [error, setError] = useState<{ message?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            onPreload();
            const searchParams = new URLSearchParams(location.search);
            await loadLocalesPublicApp({ app: APPS.PROTONVPN_SETTINGS, pathLocale, searchParams, locales });
            setLoading(false);
        };

        wrapUnloadError(run()).catch((error) => {
            setError({
                message: getNonEmptyErrorMessage(error),
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

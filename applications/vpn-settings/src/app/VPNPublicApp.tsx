import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type * as H from 'history';

import { getLocaleCodePublicApp, loadLocalesPublicApp } from '@proton/account/bootstrap';
import { StandardLoadErrorPage } from '@proton/components';
import { wrapUnloadError } from '@proton/components/containers/app/errorRefresh';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { willLoadLocale } from '@proton/shared/lib/i18n/loadLocale';
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
    const [localeCode] = useState(() => {
        const searchParams = new URLSearchParams(location.search);
        return getLocaleCodePublicApp({
            locales,
            searchParams,
            pathLocale,
        });
    });
    const [loading, setLoading] = useState(willLoadLocale(localeCode.localeCode));
    const [error, setError] = useState<{ message?: string } | null>(null);

    useEffect(() => {
        const run = async () => {
            onPreload();
            await loadLocalesPublicApp({ ...localeCode, locales });
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

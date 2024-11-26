import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type * as H from 'history';

import { getLocaleCodePublicApp, loadLocalesPublicApp } from '@proton/account/bootstrap';
import { StandardLoadErrorPage } from '@proton/components';
import useForceRefresh from '@proton/components/hooks/useForceRefresh';
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

const AccountPublicApp = ({ pathLocale, loader, location, locales = {}, children, onPreload }: Props) => {
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
    const forceRefresh = useForceRefresh();

    useEffect(() => {
        const run = async () => {
            onPreload?.();

            return loadLocalesPublicApp({
                ...localeCode,
                locales,
            });
        };

        run()
            .then(() => {
                setLoading(false);
                forceRefresh();
            })
            .catch((error) => {
                setError({
                    message: getNonEmptyErrorMessage(error),
                });
            });
    }, []);

    if (error) {
        return <StandardLoadErrorPage errorMessage={error.message} />;
    }

    return (
        <>
            {loading && <div className="absolute bg-norm h-full w-full">{loader}</div>}
            {children}
        </>
    );
};

export default AccountPublicApp;

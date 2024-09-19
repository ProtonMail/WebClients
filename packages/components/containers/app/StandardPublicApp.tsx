import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import * as bootstrap from '@proton/account/bootstrap';
import NotificationsChildren from '@proton/components/containers/notifications/Children';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

import { useConfig } from '../../hooks';
import ModalsChildren from '../modals/Children';
import StandardLoadErrorPage from './StandardLoadErrorPage';
import { wrapUnloadError } from './errorRefresh';

interface Props {
    locales?: TtagLocaleMap;
    children: ReactNode;
    loader: ReactNode;
}

const StandardPublicApp = ({ loader, locales = {}, children }: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<{ message?: string } | null>(null);
    const history = useHistory();

    useEffect(() => {
        const run = async () => {
            const searchParams = new URLSearchParams(history.location.search);
            await bootstrap.publicApp({ app: APP_NAME, locales, searchParams, pathLocale: '' });
        };
        wrapUnloadError(run())
            .then(() => setLoading(false))
            .catch((error) => {
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

    return (
        <>
            <NotificationsChildren />
            <ModalsChildren />
            {children}
        </>
    );
};

export default StandardPublicApp;

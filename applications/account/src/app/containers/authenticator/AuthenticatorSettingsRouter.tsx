import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { PrivateMainSettingsArea } from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import AuthenticatorDownloadsSettingsPage from './pages/AuthenticatorDownloadsSettingsPage';
import type { getAuthenticatorAppRoutes } from './routes';

const AuthenticatorSettingsRouter = ({
    authenticatorAppRoutes,
    redirect,
}: {
    authenticatorAppRoutes: ReturnType<typeof getAuthenticatorAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { downloads },
    } = authenticatorAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea
                    config={downloads}
                    mainAreaClass="bg-lowered settings-cards"
                    wrapperClass="w-full p-4 lg:p-6 xl:p-12 max-w-custom mx-auto"
                    style={{ '--max-w-custom': '93.75rem' }}
                >
                    <AuthenticatorDownloadsSettingsPage />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default AuthenticatorSettingsRouter;

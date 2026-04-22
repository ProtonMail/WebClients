import type { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { PrivateMainSettingsArea } from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import { SettingsCardMaxWidth } from '@proton/components/containers/layout/interface';

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
                    wrapperClass="w-full p-4 lg:pt-6 xl:pt-12 max-w-custom mx-0 lg:mx-4 xl:mx-6 xxl:mx-14 transition-spacings"
                    style={{ '--max-w-custom': SettingsCardMaxWidth.Wide }}
                >
                    <AuthenticatorDownloadsSettingsPage />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default AuthenticatorSettingsRouter;

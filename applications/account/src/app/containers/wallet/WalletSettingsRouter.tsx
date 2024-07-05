import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { PrivateMainSettingsArea } from '@proton/components/containers';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import { WalletDownloadsSettingsPage } from './WalletDownloadsSettingsPage';
import type { getWalletAppRoutes } from './routes';

const WalletSettingsRouter = ({
    walletAppRoutes,
    redirect,
}: {
    walletAppRoutes: ReturnType<typeof getWalletAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { downloads },
    } = walletAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea config={downloads}>
                    <WalletDownloadsSettingsPage />
                </PrivateMainSettingsArea>
            </Route>

            {redirect}
        </Switch>
    );
};

export default WalletSettingsRouter;

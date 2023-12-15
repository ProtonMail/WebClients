import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { getSectionPath } from '@proton/components/containers/layout/helper';
import {
    GeneralSettingsSection,
    SecuritySettingsSection,
    WalletSettingsSection,
    WalletsSettingsSection,
} from '@proton/components/containers/wallet';

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
        routes: { general, security, wallets, wallet },
    } = walletAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, general)}>
                <GeneralSettingsSection config={general} />
            </Route>
            <Route path={getSectionPath(path, security)} exact>
                <SecuritySettingsSection config={security} />
            </Route>
            <Route path={getSectionPath(path, wallets)} exact>
                <WalletsSettingsSection config={wallets} />
            </Route>
            <Route path={getSectionPath(path, wallet)} exact>
                <WalletSettingsSection config={wallet} />
            </Route>
            {redirect}
        </Switch>
    );
};

export default WalletSettingsRouter;

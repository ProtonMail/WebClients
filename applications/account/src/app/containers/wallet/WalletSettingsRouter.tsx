import { ReactNode, useEffect } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { WasmAuthData, WasmProtonWalletApiClient } from '@proton/andromeda';
import { getSectionPath } from '@proton/components/containers/layout/helper';
import {
    GeneralSettingsSection,
    SecuritySettingsSection,
    WalletSettingsSection,
    WalletsSettingsSection,
} from '@proton/components/containers/wallet';
import ExtendedApiProvider from '@proton/wallet/contexts/ExtendedApiContext/ExtendedApiProvider';

import { extendStore } from '../../store/store';
import { extraThunkArguments } from '../../store/thunk';
import type { getWalletAppRoutes } from './routes';

const WalletSettingsRouter = ({
    walletAppRoutes,
    redirect,
}: {
    walletAppRoutes: ReturnType<typeof getWalletAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    useEffect(() => {
        // TODO: remove useless arguments when WasmAuthData's contructor signature has changed
        const wasmAuth = new WasmAuthData(extraThunkArguments.authentication.UID, '', '', []);
        const walletApi = new WasmProtonWalletApiClient(wasmAuth);

        extendStore({ walletApi });
    }, []);

    const {
        routes: { general, security, wallets, wallet },
    } = walletAppRoutes;

    return (
        <ExtendedApiProvider api={extraThunkArguments.api} walletApi={extraThunkArguments.walletApi}>
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
        </ExtendedApiProvider>
    );
};

export default WalletSettingsRouter;

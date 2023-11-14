import { ReactNode } from 'react';
import { Switch } from 'react-router-dom';

import type { getWalletAppRoutes } from './routes';

const WalletSettingsRouter = ({
    // walletAppRoutes,
    redirect,
}: {
    walletAppRoutes: ReturnType<typeof getWalletAppRoutes>;
    redirect: ReactNode;
}) => {
    return <Switch>{redirect}</Switch>;
};

export default WalletSettingsRouter;

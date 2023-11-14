import { SidebarConfig } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';

export const getWalletAppRoutes = (): SidebarConfig => {
    return {
        header: WALLET_APP_NAME,
        routes: {},
    };
};

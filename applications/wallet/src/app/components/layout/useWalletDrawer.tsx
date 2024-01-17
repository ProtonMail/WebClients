import { c } from 'ttag';

import { Icon } from '@proton/components/components';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import { useDrawer, useOpenDrawerOnLoad } from '@proton/components/hooks';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { isAppInView } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_NATIVE_APPS } from '@proton/shared/lib/drawer/interfaces';

export const useWalletDrawer = () => {
    const { appInView, showDrawerSidebar, toggleDrawerApp } = useDrawer();

    useOpenDrawerOnLoad();

    const drawerSidebarButtons = [
        <DrawerAppButton
            key="toggle-wallet-quick-actions-drawer-app-button"
            tooltipText={c('Title').t`Quick actions`}
            data-testid="wallet-quick-actions-drawer-app-button"
            buttonContent={<Icon name="lightbulb" />}
            onClick={() => {
                toggleDrawerApp({ app: DRAWER_NATIVE_APPS.WALLET_QUICK_ACTIONS })();
            }}
            alt={c('Action').t`Toggle ${WALLET_APP_NAME} quick actions`}
            aria-expanded={isAppInView(DRAWER_NATIVE_APPS.WALLET_QUICK_ACTIONS, appInView)}
            aria-controls="wallet-quick-actions-drawer-app"
        />,
    ];

    return { drawerSidebarButtons, showDrawerSidebar };
};

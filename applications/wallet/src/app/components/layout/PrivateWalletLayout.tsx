import { ReactNode } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { DrawerSidebar, PrivateAppContainer, PrivateMainArea, TopBanners, useToggle } from '@proton/components';
import DrawerVisibilityButton from '@proton/components/components/drawer/DrawerVisibilityButton';
import { APPS } from '@proton/shared/lib/constants';

import { useBitcoinBlockchainContext } from '../../contexts';
import { WalletDrawerApp } from './WalletDrawerApp';
import WalletHeader from './WalletHeader';
import WalletSidebar from './WalletSidebar';
import { useWalletDrawer } from './useWalletDrawer';

interface Props {
    children: ReactNode;
}

export const PrivateWalletLayout = ({ children }: Props) => {
    const { isInitialised, decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const { drawerSidebarButtons, showDrawerSidebar } = useWalletDrawer();

    return (
        <PrivateAppContainer
            top={<TopBanners app={APPS.PROTONWALLET} />}
            header={<WalletHeader isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />}
            sidebar={<WalletSidebar expanded={expanded} apiWalletsData={decryptedApiWalletsData} />}
            drawerApp={<WalletDrawerApp />}
        >
            <PrivateMainArea
                hasToolbar
                data-testid="wallet-view:events-area"
                drawerSidebar={<DrawerSidebar buttons={drawerSidebarButtons} />}
                drawerVisibilityButton={<DrawerVisibilityButton />}
                mainBordered={!!showDrawerSidebar}
            >
                {isInitialised ? (
                    children
                ) : (
                    <div className="m-auto">
                        <CircleLoader size="large" className="color-primary" />
                    </div>
                )}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

export const withLayout = (component: ReactNode) => <PrivateWalletLayout>{component}</PrivateWalletLayout>;

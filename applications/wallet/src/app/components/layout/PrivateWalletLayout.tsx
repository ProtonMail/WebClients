import { ReactNode } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners, useToggle } from '@proton/components';

import { useBlockchainContext } from '../../contexts';
import WalletHeader from './WalletHeader';
import WalletQuickSettings from './WalletQuickSettings';
import WalletSidebar from './WalletSidebar';

interface Props {
    children: ReactNode;
}

export const PrivateWalletLayout = ({ children }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();
    const { wallets } = useBlockchainContext();

    return (
        <PrivateAppContainer
            top={<TopBanners />}
            header={<WalletHeader isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />}
            sidebar={<WalletSidebar wallets={wallets} />}
            drawerApp={<DrawerApp customAppSettings={<WalletQuickSettings />} />}
        >
            <PrivateMainArea hasToolbar className="full-height-content" data-testid="wallet-view:events-area">
                {wallets ? (
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

import { ReactNode } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { DrawerApp, PrivateAppContainer, PrivateMainArea, TopBanners, useToggle } from '@proton/components';

import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import WalletHeader from './WalletHeader';
import WalletQuickSettings from './WalletQuickSettings';
import WalletSidebar from './WalletSidebar';

interface Props {
    children: ReactNode;
    contentLoading?: boolean;
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

export const PrivateWalletLayout = ({ children, wallets, contentLoading }: Props) => {
    const { state: expanded, toggle: toggleExpanded } = useToggle();

    return (
        <PrivateAppContainer
            top={<TopBanners />}
            header={<WalletHeader isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />}
            sidebar={<WalletSidebar wallets={wallets} />}
            drawerApp={<DrawerApp customAppSettings={<WalletQuickSettings />} />}
        >
            <PrivateMainArea hasToolbar className="full-height-content" data-testid="wallet-view:events-area">
                {contentLoading ? (
                    <div className="m-auto">
                        <CircleLoader size="large" className="color-primary" />
                    </div>
                ) : (
                    children
                )}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

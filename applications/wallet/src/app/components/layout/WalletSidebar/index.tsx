import { memo } from 'react';

import { AppVersion, AppsDropdown, MainLogo, Sidebar, SidebarList, SidebarNav } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import changelog from '../../../../../CHANGELOG.md';
import { WalletWithAccountsWithBalanceAndTxs } from '../../../types';
import { BitcoinMovementNavItems } from './BitcoinMovementNavItems';
import { SecurityChecklist } from './SecurityChecklist';
import { TransactionsNavItem } from './TransactionsNavItem';
import { WalletsSidebarList } from './WalletsSidebarList';

interface Props {
    expanded?: boolean;
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

const WalletSidebar = ({ expanded = false, wallets }: Props) => {
    return (
        <>
            <Sidebar
                expanded={expanded}
                appsDropdown={<AppsDropdown app={APPS.PROTONWALLET} />}
                logo={<MainLogo to="/" data-testid="main-logo" />}
                version={<AppVersion changelog={changelog} />}
            >
                <SidebarNav className="flex mt-6">
                    <div className="outline-none flex flex-column justify-space-between grow">
                        <div className="grow">
                            <SidebarList>
                                <WalletsSidebarList wallets={wallets} />
                                <TransactionsNavItem />
                                <BitcoinMovementNavItems />
                            </SidebarList>
                        </div>

                        <div className="mb-4 mx-4">
                            <SecurityChecklist />
                        </div>
                    </div>
                </SidebarNav>
            </Sidebar>
        </>
    );
};

export default memo(WalletSidebar);

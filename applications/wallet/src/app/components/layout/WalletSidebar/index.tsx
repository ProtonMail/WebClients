import { memo } from 'react';

import { AppVersion, AppsDropdown, MainLogo, Sidebar, SidebarList, SidebarNav } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import changelog from '../../../../../CHANGELOG.md';
import { BitcoinMovementNavItems } from './BitcoinMovementNavItems';
import { SecurityChecklist } from './SecurityChecklist';
import { TransactionsNavItem } from './TransactionsNavItem';
import { WalletsList } from './WalletsList';

interface Props {
    expanded?: boolean;
}

const WalletSidebar = ({ expanded = false }: Props) => {
    return (
        <>
            <Sidebar
                expanded={expanded}
                appsDropdown={<AppsDropdown app={APPS.PROTONWALLET} />}
                logo={<MainLogo to="/" data-testid="main-logo" />}
                version={<AppVersion changelog={changelog} />}
            >
                <SidebarNav className="flex mt-6">
                    <div className="outline-none flex flex-column flex-justify-space-between flex-item-grow">
                        <div className="flex-item-grow">
                            <SidebarList>
                                <WalletsList />
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

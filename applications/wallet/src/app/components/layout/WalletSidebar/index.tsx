import { memo } from 'react';

import { AppVersion, AppsDropdown, MainLogo, Sidebar, SidebarList, SidebarNav } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { IWasmApiWalletData } from '@proton/wallet';

import changelog from '../../../../../CHANGELOG.md';
import { BitcoinMovementNavItems } from './BitcoinMovementNavItems';
import { SecurityChecklist } from './SecurityChecklist';
import { TransactionsNavItem } from './TransactionsNavItem';
import { WalletsSidebarList } from './WalletsSidebarList';

interface Props {
    expanded?: boolean;
    apiWalletsData?: IWasmApiWalletData[];
}

const { PROTONWALLET: PROTONWALLET_APP } = APPS;

const WalletSidebar = ({ expanded = false, apiWalletsData }: Props) => {
    return (
        <Sidebar
            app={PROTONWALLET_APP}
            expanded={expanded}
            appsDropdown={<AppsDropdown app={PROTONWALLET_APP} />}
            logo={<MainLogo to="/" data-testid="main-logo" />}
            version={<AppVersion changelog={changelog} />}
        >
            <SidebarNav className="flex mt-6">
                <div className="outline-none flex flex-column justify-space-between grow">
                    <div className="grow max-w-full">
                        <SidebarList>
                            <WalletsSidebarList apiWalletsData={apiWalletsData} />
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
    );
};

export default memo(WalletSidebar);

import { memo, useEffect } from 'react';

import {
    AppLink,
    AppVersion,
    AppsDropdown,
    Sidebar,
    SidebarList,
    SidebarNav,
    UserDropdown,
    useActiveBreakpoint,
} from '@proton/components';
import { registerSessionRemovalListener } from '@proton/shared/lib/authentication/persistedSessionStorage';
import { APPS, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import protonWalletLogoDark from '@proton/styles/assets/img/illustrations/proton-wallet-logo-dark.svg';
import protonWalletLogo from '@proton/styles/assets/img/illustrations/proton-wallet-logo.svg';
import type { IWasmApiWalletData } from '@proton/wallet';
import { WalletThemeOption } from '@proton/wallet/utils/theme';

import config from '../../../config';
import { clearWalletAccountMetricsData, clearWalletData } from '../../../utils/cache';
import { useWalletTheme } from '../../Layout/Theme/WalletThemeProvider';
import { OtherSidebarListItems } from './OtherSidebarListItems';
import { WalletsSidebarList } from './WalletsSidebarList';

import './WalletSidebar.scss';

interface Props {
    expanded?: boolean;
    loadingApiWalletsData?: boolean;
    apiWalletsData?: IWasmApiWalletData[];
    onToggleExpand?: () => void;
    onAddWallet: () => void;
    onImportWallet: () => void;
    onAddWalletAccount: (apiWalletData: IWasmApiWalletData) => void;
}

const { PROTONWALLET: PROTONWALLET_APP } = APPS;

const WalletSidebar = ({
    expanded = false,
    loadingApiWalletsData = false,
    apiWalletsData,
    onAddWallet,
    onImportWallet,
    onAddWalletAccount,
    onToggleExpand,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const theme = useWalletTheme();

    useEffect(() => {
        if (!apiWalletsData) {
            return;
        }
        return registerSessionRemovalListener(async () => {
            const fingerprints = apiWalletsData
                .map((walletData) => walletData.Wallet.Fingerprint)
                .filter((fingerprint) => fingerprint !== null);
            clearWalletData(fingerprints);
            const accountIDs = apiWalletsData.flatMap((walletData) =>
                walletData.WalletAccounts.map((accountData) => accountData.ID)
            );
            clearWalletAccountMetricsData(accountIDs);
        });
    }, [apiWalletsData]);

    return (
        <Sidebar
            app={PROTONWALLET_APP}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            appsDropdown={<AppsDropdown app={PROTONWALLET_APP} />}
            logo={
                <AppLink
                    to="/"
                    toApp={config.APP_NAME}
                    target="_self"
                    className="wallet-logo p-1 relative interactive-pseudo-protrude interactive--no-background"
                >
                    <img
                        src={theme === WalletThemeOption.WalletDark ? protonWalletLogoDark : protonWalletLogo}
                        alt={WALLET_APP_NAME}
                    />
                </AppLink>
            }
            version={<AppVersion />}
            showStorage={false}
            className="wallet-sidebar-overide bg-weak"
        >
            <div className="flex flex-column flex-1 flex-nowrap outline-none">
                {/* Sidebar already mounts UserDropdown when viewportWidth['<=small'] is true */}
                {!viewportWidth['<=small'] && (
                    <div className="user-dropdown-override px-4 mt-2 mb-10 w-full shrink-0">
                        <UserDropdown app={PROTONWALLET_APP} dropdownIcon="chevron-down" />
                    </div>
                )}

                <SidebarNav className="flex px-1">
                    <SidebarList className="flex flex-column flex-nowrap w-full flex-auto">
                        <WalletsSidebarList
                            loadingApiWalletsData={loadingApiWalletsData}
                            apiWalletsData={apiWalletsData}
                            onAddWalletAccount={onAddWalletAccount}
                            onAddWallet={onAddWallet}
                            onImportWallet={onImportWallet}
                        />

                        <li className="flex-1 grow" aria-hidden="true" />

                        <OtherSidebarListItems />
                    </SidebarList>
                </SidebarNav>
            </div>
        </Sidebar>
    );
};

export default memo(WalletSidebar);

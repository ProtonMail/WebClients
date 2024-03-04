import { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { c } from 'ttag';

import { WasmNetwork } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { PrivateHeader, QuickSettingsAppButton, UserDropdown, useActiveBreakpoint } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { useBitcoinBlockchainContext } from '../../contexts';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    title?: string;
}

const networkLabelByWasmNetwork: Record<WasmNetwork, string> = {
    [WasmNetwork.Bitcoin]: 'Mainnet',
    [WasmNetwork.Regtest]: 'Regtest',
    [WasmNetwork.Testnet]: 'Testnet',
    [WasmNetwork.Signet]: 'Signet',
};

const WalletHeader = ({ isHeaderExpanded, toggleHeaderExpanded, title = c('Title').t`Wallet` }: Props) => {
    const { walletId } = useParams<{ walletId?: string }>();

    const { viewportWidth } = useActiveBreakpoint();
    const { syncingMetatadaByAccountId, network, decryptedApiWalletsData, syncSingleWallet, syncManyWallets } =
        useBitcoinBlockchainContext();

    const syncingText = useMemo(() => {
        if (walletId) {
            const wallet = decryptedApiWalletsData?.find(({ Wallet: { ID } }) => ID === walletId);

            if (!wallet) {
                return null;
            }

            const walletAccountIds = wallet.WalletAccounts.map(({ ID }) => ID);
            return walletAccountIds.some((walletAccountId) => !!syncingMetatadaByAccountId[walletAccountId]?.syncing)
                ? c('Wallet header').t`Wallet syncing in progress`
                : null;
        }

        const hasSyncingAccounts = Object.values(syncingMetatadaByAccountId).some((account) => account?.syncing);

        return hasSyncingAccounts ? c('Wallet header').t`Wallets syncing in progress` : null;
    }, [syncingMetatadaByAccountId, decryptedApiWalletsData, walletId]);

    const isSmallViewport = viewportWidth['<=small'];

    return (
        <PrivateHeader
            app={APPS.PROTONWALLET}
            userDropdown={<UserDropdown app={APPS.PROTONWALLET} />}
            title={title}
            expanded={isHeaderExpanded}
            onToggleExpand={toggleHeaderExpanded}
            settingsButton={<QuickSettingsAppButton />}
            isSmallViewport={isSmallViewport}
            hideMenuButton={!isSmallViewport}
            actionArea={
                <div className="flex h-full">
                    <div className="ml-2 flex flex-row items-center my-auto">
                        {syncingText ? (
                            <>
                                <span className="color-hint text-sm">{syncingText}</span>
                                <CircleLoader size="small" className="ml-2 color-primary" />{' '}
                            </>
                        ) : (
                            <div className="color-hint text-sm">
                                <span>{network && networkLabelByWasmNetwork[network]}</span>
                                {walletId ? (
                                    <Button
                                        shape="underline"
                                        className="ml-2"
                                        onClick={() => {
                                            void syncSingleWallet(walletId);
                                        }}
                                    >{c('Wallet header').t`Sync single wallet`}</Button>
                                ) : (
                                    <Button
                                        shape="underline"
                                        className="ml-2"
                                        onClick={() => {
                                            void syncManyWallets(
                                                decryptedApiWalletsData?.map(({ Wallet: { ID } }) => ID) ?? []
                                            );
                                        }}
                                    >{c('Wallet header').t`Sync all wallets`}</Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            }
        />
    );
};

export default WalletHeader;

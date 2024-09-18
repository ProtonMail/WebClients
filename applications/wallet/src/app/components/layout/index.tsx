import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { PrivateAppContainer, PrivateMainArea, useToggle } from '@proton/components';
import type { IWasmApiWalletData } from '@proton/wallet';

import { LayoutViewLoader } from '../../atoms/LayoutViewLoader';
import { useBitcoinBlockchainContext } from '../../contexts';
import { WalletSetupModalKind, useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { getThemeForWallet } from '../../utils';
import WalletHeader from './WalletHeader';
import WalletSidebar from './WalletSidebar';

interface Props {
    children?: ReactNode;
}

export const PrivateWalletLayout = ({ children }: Props) => {
    const { walletId, accountId } = useParams<{ walletId?: string; accountId?: string }>();
    const { apiWalletsData, loadingApiWalletsData, getSyncingData } = useBitcoinBlockchainContext();

    const syncingData = walletId ? getSyncingData(walletId, accountId) : undefined;

    const { open } = useWalletSetupModalContext();

    const { state: expanded, toggle: toggleExpanded } = useToggle();

    return (
        <PrivateAppContainer
            header={
                <WalletHeader
                    isHeaderExpanded={expanded}
                    toggleHeaderExpanded={toggleExpanded}
                    syncingError={syncingData?.error}
                />
            }
            sidebar={
                <WalletSidebar
                    expanded={expanded}
                    loadingApiWalletsData={loadingApiWalletsData}
                    apiWalletsData={apiWalletsData}
                    onToggleExpand={toggleExpanded}
                    onAddWallet={() => {
                        open({
                            theme: getThemeForWallet(apiWalletsData, walletId),
                            kind: WalletSetupModalKind.WalletCreation,
                        });
                    }}
                    onAddWalletAccount={(apiWalletData: IWasmApiWalletData) => {
                        open({
                            theme: getThemeForWallet(apiWalletsData, walletId),
                            kind: WalletSetupModalKind.WalletAccountCreation,
                            apiWalletData,
                        });
                    }}
                />
            }
        >
            <PrivateMainArea data-testid="wallet-view:events-area" drawerSidebar>
                {!apiWalletsData || loadingApiWalletsData ? (
                    <LayoutViewLoader />
                ) : (
                    <div className="overflow-auto flex grow">
                        <div className="w-full max-w-custom mx-auto grow" style={{ '--max-w-custom': '80rem' }}>
                            {children}
                        </div>
                    </div>
                )}
            </PrivateMainArea>
        </PrivateAppContainer>
    );
};

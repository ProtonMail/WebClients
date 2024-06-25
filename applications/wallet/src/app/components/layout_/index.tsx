import { ReactNode } from 'react';
import { useParams } from 'react-router-dom';

import { PrivateAppContainer, PrivateMainArea, useToggle } from '@proton/components';
import { IWasmApiWalletData } from '@proton/wallet';

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
    const { walletId } = useParams<{ walletId?: string }>();
    const { decryptedApiWalletsData, loadingApiWalletsData } = useBitcoinBlockchainContext();

    const { open } = useWalletSetupModalContext();

    const { state: expanded, toggle: toggleExpanded } = useToggle();

    return (
        <PrivateAppContainer
            header={<WalletHeader isHeaderExpanded={expanded} toggleHeaderExpanded={toggleExpanded} />}
            sidebar={
                <WalletSidebar
                    expanded={expanded}
                    loadingApiWalletsData={loadingApiWalletsData}
                    apiWalletsData={decryptedApiWalletsData}
                    onToggleExpand={toggleExpanded}
                    onAddWallet={() => {
                        open({
                            theme: getThemeForWallet(decryptedApiWalletsData, walletId),
                            kind: WalletSetupModalKind.WalletCreation,
                        });
                    }}
                    onAddWalletAccount={(apiWalletData: IWasmApiWalletData) => {
                        open({
                            theme: getThemeForWallet(decryptedApiWalletsData, walletId),
                            kind: WalletSetupModalKind.WalletAccountCreation,
                            apiWalletData,
                        });
                    }}
                />
            }
        >
            <PrivateMainArea data-testid="wallet-view:events-area" drawerSidebar>
                {!decryptedApiWalletsData || loadingApiWalletsData ? (
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

export const withLayout = (component: ReactNode) => <PrivateWalletLayout>{component}</PrivateWalletLayout>;

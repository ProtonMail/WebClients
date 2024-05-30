import { ReactNode, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { PrivateAppContainer, PrivateMainArea, useModalState, useToggle } from '@proton/components';

import { useBitcoinBlockchainContext } from '../../contexts';
import { useWalletSetupModalContext } from '../../contexts/WalletSetupModalContext';
import { AccountCreationModal } from '../AccountCreationModal';
import { WalletCreationModal } from '../WalletCreationModal';
import WalletHeader from './WalletHeader';
import WalletSidebar from './WalletSidebar';

interface Props {
    children?: ReactNode;
}

export const PrivateWalletLayout = ({ children }: Props) => {
    const { walletId } = useParams<{ walletId?: string }>();

    const { decryptedApiWalletsData, loadingApiWalletsData } = useBitcoinBlockchainContext();
    const [walletAccountSetupModal, setWalletAccountSetupModal] = useModalState();

    const { open } = useWalletSetupModalContext();

    const { state: expanded, toggle: toggleExpanded } = useToggle();

    const wallet = useMemo(
        () => decryptedApiWalletsData?.find(({ Wallet }) => Wallet.ID === walletId),
        [walletId, decryptedApiWalletsData]
    );

    const hasNoWalletSetupYet = Boolean(decryptedApiWalletsData && !decryptedApiWalletsData.length);

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
                        open({});
                    }}
                    onAddWalletAccount={() => setWalletAccountSetupModal(true)}
                />
            }
        >
            <PrivateMainArea data-testid="wallet-view:events-area" drawerSidebar>
                {!decryptedApiWalletsData || loadingApiWalletsData ? (
                    <div className="m-auto">
                        <CircleLoader size="large" className="color-primary" />
                    </div>
                ) : (
                    <div className="overflow-auto flex grow">
                        <div className="w-full max-w-custom mx-auto grow" style={{ '--max-w-custom': '80rem' }}>
                            {children}
                        </div>
                    </div>
                )}
            </PrivateMainArea>

            {/* We want to open wallet creation modal whenever there is no wallet setup on for the user */}
            <WalletCreationModal open={hasNoWalletSetupYet && !walletAccountSetupModal.open} isFirstCreation />

            {wallet && <AccountCreationModal apiWalletData={wallet} {...walletAccountSetupModal} />}
        </PrivateAppContainer>
    );
};

export const withLayout = (component: ReactNode) => <PrivateWalletLayout>{component}</PrivateWalletLayout>;

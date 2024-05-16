import { ReactNode, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    PrivateAppContainer,
    PrivateMainArea,
    useModalState,
    useModalStateWithData,
    useToggle,
} from '@proton/components';

import { useBitcoinBlockchainContext } from '../../contexts';
import { SchemeAndData, WalletSetupScheme } from '../../hooks/useWalletSetup/type';
import { AccountCreationModal } from '../AccountCreationModal';
import { WalletAutoCreationNoticeModal } from '../WalletAutoCreationNoticeModal';
import { WalletCreationModal } from '../WalletCreationModal';
import WalletHeader from './WalletHeader';
import WalletSidebar from './WalletSidebar';

interface Props {
    children?: ReactNode;
}

export const PrivateWalletLayout = ({ children }: Props) => {
    const { walletId } = useParams<{ walletId?: string }>();

    const { decryptedApiWalletsData, loadingApiWalletsData } = useBitcoinBlockchainContext();
    const [walletSetupModal, setWalletSetupModal] = useModalStateWithData<{ schemeAndData?: SchemeAndData }>();
    const [walletAccountSetupModal, setWalletAccountSetupModal] = useModalState();

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
                    apiWalletsData={decryptedApiWalletsData}
                    onToggleExpand={toggleExpanded}
                    onAddWallet={() => setWalletSetupModal({})}
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

            <WalletAutoCreationNoticeModal
                open={hasNoWalletSetupYet && !walletAccountSetupModal.open}
                handleClickImport={() => {
                    setWalletSetupModal({ schemeAndData: { scheme: WalletSetupScheme.WalletImport } });
                }}
            />

            <WalletCreationModal schemeAndData={walletSetupModal.data?.schemeAndData} {...walletSetupModal} />

            {wallet && <AccountCreationModal apiWalletData={wallet} {...walletAccountSetupModal} />}
        </PrivateAppContainer>
    );
};

export const withLayout = (component: ReactNode) => <PrivateWalletLayout>{component}</PrivateWalletLayout>;

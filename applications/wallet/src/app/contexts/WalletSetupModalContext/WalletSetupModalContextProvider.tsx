import { ReactNode, useRef } from 'react';

import { c } from 'ttag';

import { useModalStateWithData } from '@proton/components/components';

import { ModalData, WalletSetupModalContext, WalletSetupModalKind } from '.';
import { WalletCreationModal } from '../../components';
import { WalletAccountCreationModal } from '../../components/WalletAccountCreationModal';
import { WalletBackupModal } from '../../components/WalletBackupModal';
import { WalletUpgradeModal, WalletUpgradeModalOwnProps } from '../../components/WalletUpgradeModal';
import { MAX_WALLETS_FREE, MAX_WALLET_ACCOUNTS_PER_WALLET_FREE } from '../../constants/wallet';
import { SubTheme } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';

interface Props {
    children: ReactNode;
}

export const WalletSetupModalContextProvider = ({ children }: Props) => {
    const onCloseRef = useRef<() => void>();

    const [walletUpgradeModal, setWalletUpgradeModal] = useModalStateWithData<WalletUpgradeModalOwnProps>();
    const [walletSetupModal, setWalletSetupModal] = useModalStateWithData<ModalData>({
        onClose: () => {
            onCloseRef.current?.();
        },
    });
    const { decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const close = async () => {
        walletSetupModal.onClose?.();
    };

    const open = (data: ModalData, options?: { onClose?: () => void }) => {
        // Only one modal is expected to be opened at a time
        onCloseRef.current = options?.onClose;

        if (data.kind === WalletSetupModalKind.WalletCreation) {
            // TODO: determine user plan
            const hasReachedWalletLimit = (decryptedApiWalletsData?.length ?? 0) >= MAX_WALLETS_FREE;

            if (hasReachedWalletLimit) {
                setWalletUpgradeModal({
                    theme: data.theme,
                    content: c('Wallet upgrade')
                        .t`To add a new wallet, you can either remove an existing wallet from your account or upgrade your current plan to get more wallets.`,
                });
                return;
            }
        } else if (data.kind === WalletSetupModalKind.WalletAccountCreation) {
            // TODO: determine user plan
            const hasReachedWalletAccountLimit =
                (data.apiWalletData.WalletAccounts.length ?? 0) >= MAX_WALLET_ACCOUNTS_PER_WALLET_FREE;

            if (hasReachedWalletAccountLimit) {
                setWalletUpgradeModal({
                    theme: data.theme,
                    content: c('Wallet upgrade')
                        .t`To add a new wallet account, you can either remove an existing wallet account from this wallet or upgrade your current plan to get more wallet accounts per wallet.`,
                });
                return;
            }
        }

        setWalletSetupModal(data);
    };

    return (
        <WalletSetupModalContext.Provider value={{ close, open }}>
            {children}
            {(() => {
                if (decryptedApiWalletsData && !decryptedApiWalletsData.length) {
                    // We want to open wallet creation modal whenever there is no wallet setup on for the user
                    return <WalletCreationModal theme={SubTheme.ORANGE} open isFirstCreation />;
                }

                if (walletUpgradeModal.data) {
                    return (
                        <WalletUpgradeModal
                            theme={walletUpgradeModal.data.theme}
                            content={walletUpgradeModal.data.content}
                            {...walletUpgradeModal}
                        />
                    );
                }

                switch (walletSetupModal.data?.kind) {
                    case WalletSetupModalKind.WalletCreation:
                        return <WalletCreationModal theme={walletSetupModal.data.theme} {...walletSetupModal} />;
                    case WalletSetupModalKind.WalletBackup:
                        return (
                            <WalletBackupModal
                                theme={walletSetupModal.data.theme}
                                apiWalletData={walletSetupModal.data.apiWalletData}
                                {...walletSetupModal}
                            />
                        );
                    case WalletSetupModalKind.WalletAccountCreation:
                        return (
                            <WalletAccountCreationModal
                                theme={walletSetupModal.data.theme}
                                apiWalletData={walletSetupModal.data.apiWalletData}
                                {...walletSetupModal}
                            />
                        );
                }
            })()}
        </WalletSetupModalContext.Provider>
    );
};

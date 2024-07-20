import type { ReactNode } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { useModalStateWithData } from '@proton/components/components';
import type { IWasmApiWalletData } from '@proton/wallet';
import { useUserWalletSettings } from '@proton/wallet';

import type { ModalData } from '.';
import { WalletSetupModalContext, WalletSetupModalKind } from '.';
import { WalletCreationModal } from '../../components';
import { WalletAccountCreationModal } from '../../components/WalletAccountCreationModal';
import { WalletBackupModal } from '../../components/WalletBackupModal';
import { WalletEarlyAccessUpgradePrompt } from '../../components/WalletEarlyAccessUpgradePrompt';
import { WalletTermsAndConditionsPrompt } from '../../components/WalletTermsAndConditionsPrompt';
import type { WalletUpgradeModalOwnProps } from '../../components/WalletUpgradeModal';
import { WalletUpgradeModal } from '../../components/WalletUpgradeModal';
import { MAX_WALLETS_FREE, MAX_WALLET_ACCOUNTS_PER_WALLET_FREE } from '../../constants/wallet';
import { useUserEligibility } from '../../store/hooks';
import { SubTheme } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';

interface Props {
    children: ReactNode;
}

const getPrimaryEmail = (wallet: IWasmApiWalletData[]) => {
    return wallet[0]?.WalletAccounts[0]?.Addresses[0]?.Email;
};

export const WalletSetupModalContextProvider = ({ children }: Props) => {
    const onCloseRef = useRef<() => void>();

    const [settings, loadingSettings] = useUserWalletSettings();
    const [isEligible, loadingIsEligible] = useUserEligibility();

    const [walletUpgradeModal, setWalletUpgradeModal, renderWalletUpgradeModal] =
        useModalStateWithData<WalletUpgradeModalOwnProps>();
    const [walletSetupModal, setWalletSetupModal, renderSetupModal] = useModalStateWithData<ModalData>({
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
                        .t`You have reached the maximum number of wallets supported by your current plan. Please upgrade to create more. Your support will also be essential for our fight to protect financial privacy and freedom.`,
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
                    content: c('Account upgrade')
                        .t`You have reached the maximum number of accounts supported by your current plan. Please upgrade to create more. Your support will also be essential for our fight to protect financial privacy and freedom.`,
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
                if (!isEligible && !loadingIsEligible) {
                    return <WalletEarlyAccessUpgradePrompt open />;
                }

                if (decryptedApiWalletsData && !decryptedApiWalletsData.length) {
                    // We want to open wallet creation modal whenever there is no wallet setup on for the user
                    return <WalletCreationModal theme={SubTheme.ORANGE} open isFirstCreation />;
                }

                if (!settings.AcceptTermsAndConditions && !loadingSettings) {
                    const primaryEmail = decryptedApiWalletsData && getPrimaryEmail(decryptedApiWalletsData);
                    return <WalletTermsAndConditionsPrompt open email={primaryEmail} />;
                }

                const walletWithoutWalletAccount = decryptedApiWalletsData?.find((w) => !w.WalletAccounts.length);
                if (decryptedApiWalletsData && walletWithoutWalletAccount) {
                    // We want to open wallet account creation modal whenever there is no wallet account setup on for the wallet
                    return (
                        <WalletAccountCreationModal
                            theme={SubTheme.ORANGE}
                            open
                            apiWalletData={walletWithoutWalletAccount}
                        />
                    );
                }

                if (walletUpgradeModal.data) {
                    return (
                        renderWalletUpgradeModal && (
                            <WalletUpgradeModal
                                theme={walletUpgradeModal.data.theme}
                                content={walletUpgradeModal.data.content}
                                {...walletUpgradeModal}
                            />
                        )
                    );
                }

                switch (walletSetupModal.data?.kind) {
                    case WalletSetupModalKind.WalletCreation:
                        return (
                            renderSetupModal && (
                                <WalletCreationModal theme={walletSetupModal.data.theme} {...walletSetupModal} />
                            )
                        );
                    case WalletSetupModalKind.WalletBackup:
                        return (
                            renderSetupModal && (
                                <WalletBackupModal
                                    theme={walletSetupModal.data.theme}
                                    apiWalletData={walletSetupModal.data.apiWalletData}
                                    {...walletSetupModal}
                                />
                            )
                        );
                    case WalletSetupModalKind.WalletAccountCreation:
                        return (
                            renderSetupModal && (
                                <WalletAccountCreationModal
                                    theme={walletSetupModal.data.theme}
                                    apiWalletData={walletSetupModal.data.apiWalletData}
                                    {...walletSetupModal}
                                />
                            )
                        );
                }
            })()}
        </WalletSetupModalContext.Provider>
    );
};

import type { ReactNode } from 'react';
import { useRef } from 'react';

import { c } from 'ttag';

import { useModalState, useModalStateWithData } from '@proton/components';
import { useOrganization } from '@proton/components/hooks';
import type { IWasmApiWalletData } from '@proton/wallet';
import { useUserEligibility, useUserWalletSettings } from '@proton/wallet/store';

import type { ModalData } from '.';
import { WalletSetupModalContext, WalletSetupModalKind } from '.';
import { WalletCreationModal } from '../../components';
import { WalletAccountCreationModal } from '../../components/WalletAccountCreationModal';
import { WalletBackupModal } from '../../components/WalletBackupModal';
import { WalletEarlyAccessUpgradePrompt } from '../../components/WalletEarlyAccessUpgradePrompt';
import type { WalletUpgradeModalOwnProps } from '../../components/WalletUpgradeModal';
import { WalletUpgradeModal } from '../../components/WalletUpgradeModal';
import { WalletWelcomePrompt } from '../../components/WalletWelcomePrompt';
import { DEFAULT_MAX_SUB_WALLETS, DEFAULT_MAX_WALLETS } from '../../constants/wallet';
import { SubTheme } from '../../utils';
import { useBitcoinBlockchainContext } from '../BitcoinBlockchainContext';

interface Props {
    children: ReactNode;
}

const getPrimaryEmail = (wallet?: IWasmApiWalletData[]) => {
    const emails = wallet?.flatMap((w) => w.WalletAccounts.flatMap((a) => a.Addresses));
    return emails?.at(0)?.Email;
};

export const WalletSetupModalContextProvider = ({ children }: Props) => {
    const onCloseRef = useRef<() => void>();

    const [settings, loadingSettings] = useUserWalletSettings();
    const [organization] = useOrganization();

    const [isEligible, loadingIsEligible] = useUserEligibility();

    const [walletUpgradeModal, setWalletUpgradeModal, renderWalletUpgradeModal] =
        useModalStateWithData<WalletUpgradeModalOwnProps>();
    const [walletSetupModal, setWalletSetupModal, renderSetupModal] = useModalStateWithData<ModalData>({
        onClose: () => {
            onCloseRef.current?.();
        },
    });
    const [walletWelcomeModal, setWalletWelcomeModal] = useModalState();
    const { apiWalletsData } = useBitcoinBlockchainContext();

    const close = async () => {
        walletSetupModal.onClose?.();
    };

    const open = (data: ModalData, options?: { onClose?: () => void }) => {
        // Only one modal is expected to be opened at a time
        onCloseRef.current = options?.onClose;

        if (data.kind === WalletSetupModalKind.WalletCreation) {
            // TODO: determine user plan
            const hasReachedWalletLimit =
                (apiWalletsData?.length ?? 0) >= (organization?.MaxWallets ?? DEFAULT_MAX_WALLETS);

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
                (data.apiWalletData.WalletAccounts.length ?? 0) >=
                (organization?.MaxSubWallets ?? DEFAULT_MAX_SUB_WALLETS);

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
                if (loadingIsEligible) {
                    return null;
                }

                if (!isEligible) {
                    return <WalletEarlyAccessUpgradePrompt open />;
                }

                if (apiWalletsData && !apiWalletsData.length) {
                    // We want to open wallet creation modal whenever there is no wallet setup on for the user
                    return (
                        <WalletCreationModal
                            theme={SubTheme.ORANGE}
                            open
                            isFirstCreation={!settings.WalletCreated}
                            onWalletCreate={({ isFirstCreation }) => {
                                if (isFirstCreation) {
                                    setWalletWelcomeModal(true);
                                }
                            }}
                        />
                    );
                }

                if ((!settings.AcceptTermsAndConditions && !loadingSettings) || walletWelcomeModal.open) {
                    return (
                        <WalletWelcomePrompt
                            open
                            onClose={walletWelcomeModal.onClose}
                            email={getPrimaryEmail(apiWalletsData)}
                        />
                    );
                }

                const walletWithoutWalletAccount = apiWalletsData?.find((w) => !w.WalletAccounts.length);
                if (apiWalletsData && walletWithoutWalletAccount) {
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

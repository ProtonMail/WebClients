import { useEffect, useState } from 'react';

import first from 'lodash/first';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import type { ModalOwnProps } from '@proton/components';
import { useModalState, useModalStateWithData } from '@proton/components';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { IWasmApiWalletData } from '@proton/wallet';
import { toWalletAccountSelectorOptions } from '@proton/wallet';
import { useUserWalletSettings } from '@proton/wallet/store';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import type { SubTheme } from '../../utils';
import {
    getAccountBalance,
    getAccountWithChainDataFromManyWallets,
    getExchangeRateFromBitcoinUnit,
    isWalletAccountSet,
} from '../../utils';
import { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { InviteModal } from '../InviteModal';
import { InviteSentConfirmModal } from '../InviteSentConfirmModal';
import type { Steps } from '../ModalHeaderWithStepper';
import { ModalHeaderWithStepper } from '../ModalHeaderWithStepper';
import { WalletAccountSelector } from '../WalletAccountSelector';
import { AmountInput } from './AmountInput';
import { RecipientsSelection } from './RecipientsSelection';
import { TransactionReview } from './TransactionReview';
import { useFeesInput } from './TransactionReview/useFeesInput';
import { TransactionSendConfirmationModal } from './TransactionSendConfirmationModal';

interface Props {
    theme?: SubTheme;
    wallet: IWasmApiWalletData;
    account?: WasmApiWalletAccount;
    modal: ModalOwnProps;
    onDone?: () => void;
}

enum StepKey {
    RecipientsSelection = 'RecipientsSelection',
    AmountInput = 'AmountInput',
    ReviewTransaction = 'ReviewTransaction',
    Send = 'Send',
}

const getSteps = (): Steps<StepKey> => [
    { key: StepKey.RecipientsSelection, label: c('bitcoin buy').t`Recipients` },
    { key: StepKey.AmountInput, label: c('bitcoin buy').t`Amount` },
    { key: StepKey.ReviewTransaction, label: c('bitcoin buy').t`Review` },
    { key: StepKey.Send, label: c('bitcoin buy').t`Send` },
];

export const BitcoinSendModal = ({ wallet, account, theme, modal, onDone }: Props) => {
    const [stepKey, setStepKey] = useState<StepKey>(StepKey.RecipientsSelection);
    const [settings] = useUserWalletSettings();
    const [exchangeRate, setUnit] = useState<WasmApiExchangeRate>(getExchangeRateFromBitcoinUnit(settings.BitcoinUnit));
    const recipientHelpers = useEmailAndBtcAddressesMaps();
    const [sendConfirmModal, setSendConfirmModal] = useModalState();
    const [inviteModal, setInviteModal] = useModalState();
    const [sentInviteConfirmModal, setSentInviteConfirmModal] = useModalStateWithData<{ email: string }>();

    const defaultWalletAccount = first(wallet.WalletAccounts);
    const [selectedWalletAccount, setSelectedWalletAccount] = useState<[WasmApiWallet, WasmApiWalletAccount?]>([
        wallet.Wallet,
        account ?? defaultWalletAccount,
    ]);
    const [, walletAccount] = selectedWalletAccount;

    const { walletsChainData, apiWalletsData } = useBitcoinBlockchainContext();

    const wasmAccount = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        selectedWalletAccount[0]?.ID,
        selectedWalletAccount[1]?.ID
    );

    const txBuilderHelpers = useTxBuilder();
    const { updateTxBuilder } = txBuilderHelpers;

    const isUsingBitcoinViaEmail = Object.values(recipientHelpers.recipientEmailMap).some(
        (recipient) => recipient?.recipient.Address && validateEmailAddress(recipient?.recipient.Address)
    );

    const { getFeesByBlockTarget } = useFeesInput(txBuilderHelpers);

    useEffect(() => {
        if (wasmAccount?.account) {
            updateTxBuilder((txBuilder) => txBuilder.setAccount(wasmAccount.account));
        }
    }, [updateTxBuilder, wasmAccount]);

    if (!isWalletAccountSet(selectedWalletAccount)) {
        return null;
    }

    return (
        <>
            <FullscreenModal
                header={
                    <ModalHeaderWithStepper
                        onClose={() => {
                            modal.onClose?.();
                            onDone?.();
                        }}
                        onClickStep={(key) => {
                            setStepKey(key);
                        }}
                        currentStep={stepKey}
                        steps={getSteps()}
                    />
                }
                {...modal}
            >
                <div className="flex flex-column items-center mb-8 wallet-fullscreen-modal-left">
                    <div className="sticky top-0 w-full">
                        <WalletAccountSelector
                            doNotShowInvalidWalletAccounts
                            value={selectedWalletAccount}
                            onSelect={(selected) => {
                                setSelectedWalletAccount(selected);
                            }}
                            options={toWalletAccountSelectorOptions(apiWalletsData ?? [])}
                            checkIsValid={async (w, a, accountChainData) => {
                                const balance = await getAccountBalance(accountChainData);
                                return balance > 0;
                            }}
                        />
                    </div>
                </div>

                <div className="h-full">
                    <div className="wallet-fullscreen-modal-main">
                        {stepKey === StepKey.RecipientsSelection && walletAccount && (
                            <RecipientsSelection
                                apiAccount={walletAccount}
                                txBuilderHelpers={txBuilderHelpers}
                                recipientHelpers={recipientHelpers}
                                onRecipientsConfirm={() => {
                                    setStepKey(StepKey.AmountInput);
                                }}
                            />
                        )}

                        {stepKey === StepKey.AmountInput && walletAccount && wasmAccount?.account && (
                            <AmountInput
                                apiAccount={walletAccount}
                                account={wasmAccount}
                                txBuilderHelpers={txBuilderHelpers}
                                btcAddressMap={recipientHelpers.btcAddressMap}
                                onBack={() => setStepKey(StepKey.RecipientsSelection)}
                                onReview={(exchangeRate: WasmApiExchangeRate) => {
                                    setUnit(exchangeRate);
                                    setStepKey(StepKey.ReviewTransaction);
                                }}
                            />
                        )}

                        {stepKey === StepKey.ReviewTransaction && walletAccount && (
                            <TransactionReview
                                isUsingBitcoinViaEmail={isUsingBitcoinViaEmail}
                                wallet={wallet}
                                account={walletAccount}
                                exchangeRate={exchangeRate}
                                txBuilderHelpers={txBuilderHelpers}
                                btcAddressMap={recipientHelpers.btcAddressMap}
                                onBack={() => setStepKey(StepKey.AmountInput)}
                                getFeesByBlockTarget={getFeesByBlockTarget}
                                onSent={() => {
                                    setStepKey(StepKey.Send);
                                    modal.onClose?.();
                                    setSendConfirmModal(true);
                                }}
                                onBackToEditRecipients={() => setStepKey(StepKey.RecipientsSelection)}
                            />
                        )}
                    </div>
                </div>

                {/* empty div for grid centering */}
                <div className="wallet-fullscreen-modal-right" />
            </FullscreenModal>

            <TransactionSendConfirmationModal
                {...sendConfirmModal}
                theme={theme}
                onClickDone={() => {
                    sendConfirmModal.onClose?.();
                    onDone?.();
                }}
                onClickInviteAFriend={() => {
                    sendConfirmModal.onClose();
                    setInviteModal(true);
                }}
            />

            <InviteModal
                defaultInviterAddressID={walletAccount?.Addresses?.[0]?.ID}
                {...inviteModal}
                onInviteSent={(email) => {
                    inviteModal.onClose();
                    setSentInviteConfirmModal({ email });
                }}
                onClose={() => {
                    inviteModal.onClose();
                    setSendConfirmModal(true);
                }}
            />

            {sentInviteConfirmModal.data && (
                <InviteSentConfirmModal
                    {...sentInviteConfirmModal}
                    email={sentInviteConfirmModal.data.email}
                    onClose={() => {
                        sentInviteConfirmModal.onClose();
                        setSendConfirmModal(true);
                    }}
                />
            )}
        </>
    );
};

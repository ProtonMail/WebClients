import { useEffect, useState } from 'react';

import first from 'lodash/first';
import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';
import type { ModalOwnProps } from '@proton/components';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { IWasmApiWalletData } from '@proton/wallet';
import { toWalletAccountSelectorOptions } from '@proton/wallet';
import { useUserWalletSettings } from '@proton/wallet/store';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useFeesInput } from '../../hooks/useFeesInput';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import type { SubTheme } from '../../utils';
import {
    getAccountBalance,
    getAccountWithChainDataFromManyWallets,
    getExchangeRateFromBitcoinUnit,
    isWalletAccountSet,
} from '../../utils';
import { InviteModal } from '../InviteModal';
import { InviteSentConfirmModal } from '../InviteSentConfirmModal';
import type { Steps } from '../ModalHeaderWithStepper';
import { ModalHeaderWithStepper } from '../ModalHeaderWithStepper';
import { WalletAccountSelector } from '../WalletAccountSelector';
import { AmountInputStep } from './AmountInputStep';
import { RecipientsSelectionStep } from './RecipientsSelectionStep';
import { TransactionReviewStep } from './TransactionReviewStep';
import { TransactionSendConfirmationModal } from './TransactionSendConfirmationModal';
import { useEmailAndBtcAddressesMaps } from './useEmailAndBtcAddressesMaps';

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

type OpenedModal = { kind: 'send' } | { kind: 'confirm' } | { kind: 'invite' } | { kind: 'inviteSent'; email: string };

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

    const [openedModal, setOpenedModal] = useState<OpenedModal>({ kind: 'send' });

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
                open={modal.open && openedModal.kind === 'send'}
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
                            <RecipientsSelectionStep
                                apiAccount={walletAccount}
                                txBuilderHelpers={txBuilderHelpers}
                                recipientHelpers={recipientHelpers}
                                onRecipientsConfirm={() => {
                                    setStepKey(StepKey.AmountInput);
                                }}
                            />
                        )}

                        {stepKey === StepKey.AmountInput && walletAccount && wasmAccount?.account && (
                            <AmountInputStep
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
                            <TransactionReviewStep
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
                                    setOpenedModal({ kind: 'confirm' });
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
                open={modal.open && openedModal.kind === 'confirm'}
                theme={theme}
                onClickDone={() => {
                    modal.onClose?.();
                    onDone?.();
                }}
                onClickInviteAFriend={() => {
                    setOpenedModal({ kind: 'invite' });
                }}
            />

            <InviteModal
                defaultInviterAddressID={walletAccount?.Addresses?.[0]?.ID}
                open={modal.open && openedModal.kind === 'invite'}
                onInviteSent={(email) => {
                    setOpenedModal({ kind: 'inviteSent', email });
                }}
                onClose={() => {
                    modal.onClose?.();
                }}
            />

            {openedModal.kind === 'inviteSent' && (
                <InviteSentConfirmModal
                    open={modal.open && openedModal.kind === 'inviteSent'}
                    email={openedModal.email}
                    onClose={() => {
                        modal.onClose?.();
                    }}
                />
            )}
        </>
    );
};

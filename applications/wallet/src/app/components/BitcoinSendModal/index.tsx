import { useEffect, useState } from 'react';

import { first } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWallet, WasmApiWalletAccount, WasmBitcoinUnit } from '@proton/andromeda';
import { ModalOwnProps, useModalState, useModalStateWithData } from '@proton/components/components';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { IWasmApiWalletData } from '@proton/wallet';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import { SubTheme, getAccountBalance, getAccountWithChainDataFromManyWallets, isWalletAccountSet } from '../../utils';
import { toWalletAccountSelectorOptions } from '../../utils/wallet';
import { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { InviteModal } from '../InviteModal';
import { InviteSentConfirmModal } from '../InviteSentConfirmModal';
import { ModalHeaderWithStepper, Steps } from '../ModalHeaderWithStepper';
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
    const [unit, setUnit] = useState<WasmBitcoinUnit | WasmApiExchangeRate>('BTC');
    const recipientHelpers = useEmailAndBtcAddressesMaps();
    const [sendConfirmModal, setSendConfirmModal] = useModalState();
    const [inviteModal, setInviteModal] = useModalState();
    const [sentInviteConfirmModal, setSentInviteConfirmModal] = useModalStateWithData<{ email: string }>();

    const defaultWalletAccount = first(wallet.WalletAccounts);
    const [selectedWalletAccount, setSelectedWalletAccount] = useState<[WasmApiWallet, WasmApiWalletAccount?]>([
        wallet.Wallet,
        account ?? defaultWalletAccount,
    ]);

    const { walletsChainData, decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const wasmAccount = getAccountWithChainDataFromManyWallets(
        walletsChainData,
        wallet?.Wallet.ID,
        selectedWalletAccount[1]?.ID
    );

    const { txBuilder, updateTxBuilder } = useTxBuilder();

    const isUsingBitcoinViaEmail = Object.values(recipientHelpers.recipientEmailMap).some(
        (recipient) => recipient?.recipient.Address && validateEmailAddress(recipient?.recipient.Address)
    );

    const { getFeesByBlockTarget } = useFeesInput(txBuilder, updateTxBuilder);

    useEffect(() => {
        if (wasmAccount?.account) {
            updateTxBuilder(async (txBuilder) => txBuilder.setAccount(wasmAccount.account));
        }
    }, [updateTxBuilder, wasmAccount]);

    useEffect(() => {
        // This is needed because txBuilder is populated with one empty recipient on init
        updateTxBuilder((txBuilder) => txBuilder.clearRecipients());
    }, [updateTxBuilder]);

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
                className="relative"
            >
                <div className="flex flex-row justify-space-between">
                    <div className="mb-8 mr-4">
                        <WalletAccountSelector
                            value={selectedWalletAccount}
                            onSelect={(selected) => {
                                setSelectedWalletAccount(selected);
                            }}
                            options={toWalletAccountSelectorOptions(decryptedApiWalletsData ?? [])}
                            checkIsValid={async (w, a, accountChainData) => {
                                const balance = await getAccountBalance(accountChainData);
                                return balance > 0;
                            }}
                        />
                    </div>

                    <div className="w-full mx-auto" style={{ maxWidth: '31rem' }}>
                        {stepKey === StepKey.RecipientsSelection && (
                            <RecipientsSelection
                                txBuilder={txBuilder}
                                updateTxBuilder={updateTxBuilder}
                                recipientHelpers={recipientHelpers}
                                onRecipientsConfirm={() => {
                                    setStepKey(StepKey.AmountInput);
                                }}
                            />
                        )}

                        {stepKey === StepKey.AmountInput && wasmAccount?.account && (
                            <AmountInput
                                apiAccount={selectedWalletAccount[1]}
                                account={wasmAccount}
                                txBuilder={txBuilder}
                                updateTxBuilder={updateTxBuilder}
                                btcAddressMap={recipientHelpers.btcAddressMap}
                                onBack={() => setStepKey(StepKey.RecipientsSelection)}
                                onReview={(unit: WasmBitcoinUnit | WasmApiExchangeRate) => {
                                    setUnit(unit);
                                    setStepKey(StepKey.ReviewTransaction);
                                }}
                            />
                        )}

                        {stepKey === StepKey.ReviewTransaction && (
                            <TransactionReview
                                isUsingBitcoinViaEmail={isUsingBitcoinViaEmail}
                                wallet={wallet}
                                account={selectedWalletAccount[1]}
                                unit={unit}
                                txBuilder={txBuilder}
                                updateTxBuilder={updateTxBuilder}
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

                    {/* Dumb div to equilibrate flex-box */}
                    <div />
                </div>
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

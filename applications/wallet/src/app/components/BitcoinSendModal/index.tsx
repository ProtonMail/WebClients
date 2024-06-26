import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit } from '@proton/andromeda';
import { ModalOwnProps, useModalState, useModalStateWithData } from '@proton/components/components';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { IWasmApiWalletData } from '@proton/wallet';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import { SubTheme, getAccountWithChainDataFromManyWallets } from '../../utils';
import { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { InviteModal } from '../InviteModal';
import { InviteSentConfirmModal } from '../InviteSentConfirmModal';
import { ModalHeaderWithStepper, Steps } from '../ModalHeaderWithStepper';
import { AmountInput } from './AmountInput';
import { useOnChainFeesSelector } from './OnchainTransactionBuilderFooter/OnchainTransactionAdvancedOptions/useOnChainFeesSelector';
import { RecipientsSelection } from './RecipientsSelection';
import { TransactionReview } from './TransactionReview';
import { TransactionSendConfirmationModal } from './TransactionSendConfirmationModal';

interface Props {
    theme?: SubTheme;
    wallet: IWasmApiWalletData;
    account: WasmApiWalletAccount;
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

    const { walletsChainData } = useBitcoinBlockchainContext();

    const wasmAccount = getAccountWithChainDataFromManyWallets(walletsChainData, wallet?.Wallet.ID, account?.ID);

    const { txBuilder, updateTxBuilder } = useTxBuilder();

    const isUsingBitcoinViaEmail = Object.values(recipientHelpers.recipientEmailMap).some(
        (recipient) => recipient?.recipient.Address && validateEmailAddress(recipient?.recipient.Address)
    );

    // TODO: use this later with fee selector, for now it only set default fees for 5th next block
    useOnChainFeesSelector(txBuilder, updateTxBuilder);

    useEffect(() => {
        if (wasmAccount?.account) {
            updateTxBuilder(async (txBuilder) => txBuilder.setAccount(wasmAccount.account));
        }
    }, [updateTxBuilder, wasmAccount]);

    useEffect(() => {
        // This is needed because txBuilder is populated with one empty recipient on init
        updateTxBuilder((txBuilder) => txBuilder.clearRecipients());
    }, [updateTxBuilder]);

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
                        apiAccount={account}
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
                        account={account}
                        unit={unit}
                        txBuilder={txBuilder}
                        updateTxBuilder={updateTxBuilder}
                        btcAddressMap={recipientHelpers.btcAddressMap}
                        onBack={() => setStepKey(StepKey.AmountInput)}
                        onSent={() => {
                            setStepKey(StepKey.Send);
                            modal.onClose?.();
                            setSendConfirmModal(true);
                        }}
                        onBackToEditRecipients={() => setStepKey(StepKey.RecipientsSelection)}
                    />
                )}
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

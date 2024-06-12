import { useEffect, useState } from 'react';

import { noop } from 'lodash';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit } from '@proton/andromeda';
import { ModalOwnProps, useModalState } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import { SubTheme, getAccountWithChainDataFromManyWallets } from '../../utils';
import { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { AmountInput } from './AmountInput';
import { ModalHeader, StepKey } from './ModalHeader';
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

export const BitcoinSendModal = ({ wallet, account, theme, modal, onDone }: Props) => {
    const [stepKey, setStepKey] = useState<StepKey>(StepKey.RecipientsSelection);
    const [unit, setUnit] = useState<WasmBitcoinUnit | WasmApiExchangeRate>('BTC');
    const recipientHelpers = useEmailAndBtcAddressesMaps();
    const [sendConfirmModal, setSendConfirmModal] = useModalState();

    const { walletsChainData } = useBitcoinBlockchainContext();

    const wasmAccount = getAccountWithChainDataFromManyWallets(walletsChainData, wallet?.Wallet.ID, account?.ID);

    const { txBuilder, updateTxBuilder } = useTxBuilder();

    // TODO: use this later with fee selector, for now it only set default fees for 5th next block
    useOnChainFeesSelector(txBuilder, updateTxBuilder);

    useEffect(() => {
        if (wasmAccount?.account) {
            updateTxBuilder((txBuilder) => txBuilder.setAccount(wasmAccount.account));
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
                    <ModalHeader
                        onClose={() => {
                            modal.onClose?.();
                            onDone?.();
                        }}
                        onClickStep={(key) => {
                            setStepKey(key);
                        }}
                        currentStep={stepKey}
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
                onClickInviteAFriend={noop}
            />
        </>
    );
};

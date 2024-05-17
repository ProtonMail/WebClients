import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit } from '@proton/andromeda';
import { ModalOwnProps } from '@proton/components/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { FullscreenModal } from '../../atoms/FullscreenModal';
import { useBitcoinBlockchainContext } from '../../contexts';
import { useTxBuilder } from '../../hooks/useTxBuilder';
import { getAccountWithChainDataFromManyWallets } from '../../utils';
import { useEmailAndBtcAddressesMaps } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { AmountInput } from './AmountInput';
import { useOnChainFeesSelector } from './OnchainTransactionBuilderFooter/OnchainTransactionAdvancedOptions/useOnChainFeesSelector';
import { RecipientsSelection } from './RecipientsSelection';
import { TransactionReview } from './TransactionReview';

interface Props extends ModalOwnProps {
    wallet: IWasmApiWalletData;
    account: WasmApiWalletAccount;
}

enum StepKey {
    RecipientsSelection,
    AmountInput,
    ReviewTransaction,
}

type StepWithData =
    | {
          key: StepKey.RecipientsSelection;
      }
    | {
          key: StepKey.AmountInput;
      }
    | {
          key: StepKey.ReviewTransaction;
          unit: WasmBitcoinUnit | WasmApiExchangeRate;
      };

export const BitcoinSendModal = ({ wallet, account, ...modalProps }: Props) => {
    const [stepWithData, setStepWithData] = useState<StepWithData>({ key: StepKey.RecipientsSelection });
    const recipientHelpers = useEmailAndBtcAddressesMaps();

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
        <FullscreenModal title={c('Wallet send').t`Send bitcoin`} {...modalProps}>
            {stepWithData.key === StepKey.RecipientsSelection && (
                <RecipientsSelection
                    txBuilder={txBuilder}
                    updateTxBuilder={updateTxBuilder}
                    recipientHelpers={recipientHelpers}
                    onRecipientsConfirm={() => {
                        setStepWithData({ key: StepKey.AmountInput });
                    }}
                />
            )}

            {stepWithData.key === StepKey.AmountInput && wasmAccount?.account && (
                <AmountInput
                    account={wasmAccount}
                    txBuilder={txBuilder}
                    updateTxBuilder={updateTxBuilder}
                    btcAddressMap={recipientHelpers.btcAddressMap}
                    onBack={() => setStepWithData({ key: StepKey.RecipientsSelection })}
                    onReview={(unit: WasmBitcoinUnit | WasmApiExchangeRate) =>
                        setStepWithData({ key: StepKey.ReviewTransaction, unit })
                    }
                />
            )}

            {stepWithData.key === StepKey.ReviewTransaction && (
                <TransactionReview
                    wallet={wallet}
                    account={account}
                    unit={stepWithData.unit}
                    txBuilder={txBuilder}
                    updateTxBuilder={updateTxBuilder}
                    btcAddressMap={recipientHelpers.btcAddressMap}
                    onBack={() => setStepWithData({ key: StepKey.AmountInput })}
                    onSent={() => modalProps.onClose?.()}
                    onBackToEditRecipients={() => setStepWithData({ key: StepKey.RecipientsSelection })}
                />
            )}
        </FullscreenModal>
    );
};

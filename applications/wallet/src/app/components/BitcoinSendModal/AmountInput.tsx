import { useState } from 'react';

import { compact } from 'lodash';
import { c } from 'ttag';

import { WasmApiExchangeRate, WasmApiWalletAccount, WasmBitcoinUnit, WasmTxBuilder } from '@proton/andromeda';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { Button, CoreButton } from '../../atoms';
import { BitcoinAmountInput } from '../../atoms/BitcoinAmountInput';
import { BitcoinAmountInputWithBalanceAndCurrencySelect } from '../../atoms/BitcoinAmountInputWithBalanceAndCurrencySelect';
import { Price } from '../../atoms/Price';
import { TxBuilderUpdater } from '../../hooks/useTxBuilder';
import { useExchangeRate } from '../../store/hooks';
import { AccountWithChainData } from '../../types';
import { getAccountBalance } from '../../utils';
import { useAsyncValue } from '../../utils/hooks/useAsyncValue';
import { BtcAddressMap } from '../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { RecipientListItem } from './RecipientListItem';

interface Props {
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    btcAddressMap: BtcAddressMap;
    account: AccountWithChainData;
    apiAccount: WasmApiWalletAccount;
    onBack: () => void;
    onReview: (unit: WasmBitcoinUnit | WasmApiExchangeRate) => void;
}

export const AmountInput = ({
    txBuilder,
    updateTxBuilder,
    btcAddressMap,
    onBack,
    account,
    apiAccount,
    onReview,
}: Props) => {
    // We disable the single amount input if some recipients have been attributed different amounts
    const isSingleAmountInputHidden = txBuilder.getRecipients().reduce((acc, current, index, recipients) => {
        return acc || (index > 0 && current[2] !== recipients[index - 1][2]);
    }, false);

    const [useDetailledInput, setUseDetailledInput] = useState(isSingleAmountInputHidden);
    const [defaultExchangeRate] = useExchangeRate(apiAccount.FiatCurrency);
    const [controlledExchangeRate, setControlledExchangeRate] = useState<WasmApiExchangeRate>();

    const exchangeRate = controlledExchangeRate ?? defaultExchangeRate;

    const accountBalance = useAsyncValue(getAccountBalance(account), 0);

    const totalSentAmount = txBuilder.getRecipients().reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const remainingAmount = accountBalance - totalSentAmount;

    /**
     * User can update a single amount input, the update amount will be attributed to every recipient
     */
    const handleUpdateSingleAmount = (newAmount: number) => {
        txBuilder.getRecipients().forEach((_, i) => {
            updateTxBuilder((txBuilder) => txBuilder.updateRecipient(i, undefined, BigInt(newAmount)));
        });
    };

    const handleSendAllFromSingleAmount = () => {
        const amountPerRecipient = Math.floor(accountBalance / txBuilder.getRecipients().length);
        txBuilder.getRecipients().forEach((_, i) => {
            updateTxBuilder((txBuilder) => txBuilder.updateRecipient(i, undefined, BigInt(amountPerRecipient)));
        });
    };

    return (
        <div className="flex flex-column max-w-full">
            {useDetailledInput ? (
                <>
                    <div className="mb-6">
                        <BitcoinAmountInputWithBalanceAndCurrencySelect
                            exchangeRate={exchangeRate}
                            value={Number(totalSentAmount)}
                            onExchangeRateChange={(e) => setControlledExchangeRate(e)}
                            remainingBalance={remainingAmount}
                        />
                    </div>

                    <div className="w-full mt-4 flex flex-row justify-space-between items-center">
                        <span className="block color-hint">{c('Wallet balance').t`Split among`}</span>

                        <div>
                            <CoreButton size="small" shape="ghost" color="norm" onClick={() => onBack()}>
                                {c('Wallet send').t`Edit recipients`}
                            </CoreButton>
                        </div>
                    </div>

                    <div className="flex flex-column w-full mt-2 mb-4">
                        {txBuilder.getRecipients().map((txBuilderRecipient, index) => {
                            const recipientUid = txBuilderRecipient[0];
                            const btcAddress = txBuilderRecipient[1];
                            const amount = txBuilderRecipient[2];

                            const recipient = btcAddressMap[btcAddress];

                            // Typeguard, no recipient should be undefined here
                            if (!recipient) {
                                return null;
                            }

                            return (
                                <div
                                    key={`${recipientUid}`}
                                    className="flex flex-row flex-nowrap items-center grow py-2 rounded-lg mt-2 w-full"
                                >
                                    <div
                                        className="ui-orange rounded-full w-custom h-custom mr-4 flex items-center justify-center text-lg text-semibold no-shrink"
                                        style={{
                                            '--h-custom': '2rem',
                                            '--w-custom': '2rem',
                                            background: 'var(--interaction-norm-minor-1)',
                                            color: 'var(--interaction-norm)',
                                        }}
                                    >
                                        {getInitials(recipient.recipient.Name ?? recipient.recipient.Address)}
                                    </div>

                                    <div className="flex flex-column justify-center mr-auto">
                                        <span className="block w-full text-ellipsis text-left">
                                            {recipient.recipient.Name}
                                        </span>
                                    </div>

                                    <div className="w-custom mr-1 no-shrink" style={{ '--w-custom': '7.5rem' }}>
                                        <BitcoinAmountInput
                                            unit={exchangeRate ?? 'BTC'}
                                            value={Number(amount)}
                                            onValueChange={(v) => {
                                                updateTxBuilder((txBuilder) =>
                                                    txBuilder.updateRecipient(index, undefined, BigInt(v))
                                                );
                                            }}
                                            inputClassName="text-right"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            ) : (
                <>
                    {(() => {
                        const txBuilderRecipients = txBuilder.getRecipients();
                        const firstTxBuilderRecipient = txBuilderRecipients[0];
                        const firstRecipientAmount = firstTxBuilderRecipient[2];

                        // Typeguard, no recipient should be undefined here
                        const recipients = compact(txBuilder.getRecipients().map((r) => btcAddressMap[r[1]]));
                        const [firstRecipient] = recipients;

                        const price = (
                            <Price
                                key={'sent-amount-total'}
                                satsAmount={totalSentAmount}
                                unit={exchangeRate ?? 'BTC'}
                            />
                        );

                        return (
                            <>
                                <RecipientListItem
                                    onClickEdit={onBack}
                                    {...(recipients.length > 1 ? { recipients } : { recipient: firstRecipient })}
                                />

                                <BitcoinAmountInputWithBalanceAndCurrencySelect
                                    exchangeRate={exchangeRate}
                                    value={Number(firstRecipientAmount)}
                                    onSendAll={handleSendAllFromSingleAmount}
                                    onAmountChange={(v) => handleUpdateSingleAmount(v)}
                                    onExchangeRateChange={(e) => setControlledExchangeRate(e)}
                                    remainingBalance={remainingAmount}
                                />

                                {txBuilder.getRecipients().length > 1 && (
                                    <div className="bg-norm mx-auto flex flex-column my-4 w-full text-center py-2 rounded-lg">
                                        <span>{c('Wallet send').jt`You are sending ${price} in total`}</span>
                                        {!useDetailledInput && (
                                            <CoreButton
                                                size="small"
                                                shape="ghost"
                                                color="norm"
                                                className="mx-auto py-0"
                                                onClick={() => setUseDetailledInput(true)}
                                            >
                                                {c('Wallet send').t`Edit amounts`}
                                            </CoreButton>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </>
            )}

            <Button
                color="norm"
                shape="solid"
                className="mt-6"
                fullWidth
                onClick={() => {
                    txBuilder.getRecipients().forEach((r, i) => {
                        if (!r[2]) {
                            updateTxBuilder((txBuilder) => txBuilder.removeRecipient(i));
                        }
                    });

                    onReview(exchangeRate ?? 'BTC');
                }}
                disabled={txBuilder.getRecipients().every((r) => !r[2])}
            >{c('Wallet send').t`Review`}</Button>
        </div>
    );
};

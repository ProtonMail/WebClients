import { useCallback, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount, WasmRecipient, WasmTxBuilder } from '@proton/andromeda';
import { Icon, Tooltip } from '@proton/components/components';
import { useNotifications } from '@proton/components/hooks';
import { useUserWalletSettings } from '@proton/wallet';

import { Button, CoreButton } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { usePsbt } from '../../../hooks/usePsbt';
import type { TxBuilderUpdater } from '../../../hooks/useTxBuilder';
import { useExchangeRate } from '../../../store/hooks';
import type { AccountWithChainData } from '../../../types';
import { convertAmount, getAccountBalance, getExchangeRateFromBitcoinUnit } from '../../../utils';
import { useAsyncValue } from '../../../utils/hooks/useAsyncValue';
import { EmailListItem } from '../../EmailListItem';
import type { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { BitcoinAmountInputWithBalanceAndCurrencySelect } from './BitcoinAmountInputWithBalanceAndCurrencySelect';

const DEFAULT_MINIMUM_SATS_AMOUNT = 1000;

interface Props {
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    btcAddressMap: BtcAddressMap;
    account: AccountWithChainData;
    apiAccount: WasmApiWalletAccount;
    onBack: () => void;
    onReview: (exchangeRate: WasmApiExchangeRate) => void;
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
    const [defaultExchangeRate] = useExchangeRate(apiAccount.FiatCurrency);
    const [settings] = useUserWalletSettings();

    const [controlledExchangeRate, setControlledExchangeRate] = useState<WasmApiExchangeRate>();
    const [err, setErr] = useState<string | null>(null);
    const { createNotification } = useNotifications();
    const { createDraftPsbt } = usePsbt({ txBuilder });

    const exchangeRate = controlledExchangeRate ?? defaultExchangeRate;

    const accountBalance = useAsyncValue(getAccountBalance(account), 0);

    const exchangeRateOrBitcoinUnit = exchangeRate ?? settings.BitcoinUnit;

    // Inverted conversion is necessary because SATS conversion to Fiat does not always guarantee a valid amount
    // Supposedly, 1000 SATS = 1,001€, in reality, it is going to be rounded to 1€, so constraint min now becomes 999 SATS
    const constrainedMin = convertAmount(DEFAULT_MINIMUM_SATS_AMOUNT, 'SATS', exchangeRateOrBitcoinUnit);
    const constrainedSatMin = convertAmount(constrainedMin, exchangeRateOrBitcoinUnit, 'SATS');

    const totalSentAmount = txBuilder.getRecipients().reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const checkCreatePsbt = useCallback(() => {
        return createDraftPsbt()
            .then(() => {
                setErr(null);
                return true;
            })
            .catch((err) => {
                const message = ((): string => {
                    if (err instanceof Error) {
                        if (err.message.includes('OutputBelowDustLimit')) {
                            return c('Wallet send').t`Amount is below minimum value`;
                        }
                    }
                    return c('Wallet send').t`Could not create PSBT`;
                })();

                createNotification({ text: message, type: 'error' });
                setErr(message);
                return false;
            });
    }, [createDraftPsbt, createNotification]);

    useEffect(() => {
        if (err) {
            void checkCreatePsbt();
        }
    }, [checkCreatePsbt, err]);

    const remainingAmount = accountBalance - totalSentAmount;

    const tryUpdateRecipientAmount = (recipient: WasmRecipient, recipientIndex: number, newAmount: number) => {
        updateTxBuilder(async (txBuilder) => {
            const initialAmount = recipient[2];
            const updated = await txBuilder.updateRecipient(recipientIndex, undefined, BigInt(newAmount));
            if (updated.getRecipients()[recipientIndex][2] === initialAmount && constrainedSatMin > newAmount) {
                createNotification({
                    type: 'warning',
                    text: c('Wallet send')
                        .t`Recipient amount wasn't updated. Please check you have enough to cover input amount + fees.`,
                });
            }

            return updated;
        });
    };

    /**
     * User can update a single amount input, the update amount will be attributed to every recipient
     */
    const handleUpdateSingleAmount = (newAmount: number) => {
        txBuilder.getRecipients().forEach((r, i) => {
            const amount = r[2];
            if (Number(amount) !== newAmount) {
                tryUpdateRecipientAmount(r, i, newAmount);
            }
        });
    };

    /**
     * User can update a single amount input, the update amount will be evenly split to every recipient
     */
    const handleUpdateSingleAmountForMultiRecipients = (newAmount: number) => {
        const splitAmount = Math.floor(newAmount / txBuilder.getRecipients().length);
        txBuilder.getRecipients().forEach((r, i) => {
            const amount = r[2];
            if (Number(amount) !== splitAmount) {
                tryUpdateRecipientAmount(r, i, splitAmount);
            }
        });
    };

    const handleSendAllFromSingleAmount = () => {
        const amountPerRecipient = Math.floor(accountBalance / txBuilder.getRecipients().length);
        txBuilder.getRecipients().forEach((r, i) => {
            tryUpdateRecipientAmount(r, i, amountPerRecipient);
        });
    };

    useEffect(() => {
        handleUpdateSingleAmountForMultiRecipients(constrainedSatMin * txBuilder.getRecipients().length);
    }, [constrainedSatMin]);

    return (
        <div className="flex flex-column max-w-full">
            <h2 className="text-center mb-8 text-semibold">{c('Wallet send').t`How much are you sending?`}</h2>

            {txBuilder.getRecipients().length > 1 ? (
                <>
                    <div className="mb-6">
                        <BitcoinAmountInputWithBalanceAndCurrencySelect
                            exchangeRate={exchangeRate}
                            value={Number(totalSentAmount)}
                            secondaryExchangeRate={defaultExchangeRate}
                            onExchangeRateChange={(e) => setControlledExchangeRate(e)}
                            remainingBalance={remainingAmount}
                            onAmountChange={(v) => handleUpdateSingleAmountForMultiRecipients(v)}
                            onSendAll={handleSendAllFromSingleAmount}
                            min={constrainedMin * txBuilder.getRecipients().length}
                        />
                    </div>
                </>
            ) : (
                <>
                    {(() => {
                        const txBuilderRecipients = txBuilder.getRecipients();
                        const firstTxBuilderRecipient = txBuilderRecipients[0];
                        const firstRecipientAmount = firstTxBuilderRecipient[2];

                        return (
                            <BitcoinAmountInputWithBalanceAndCurrencySelect
                                exchangeRate={exchangeRate}
                                value={Number(firstRecipientAmount)}
                                secondaryExchangeRate={defaultExchangeRate}
                                onSendAll={handleSendAllFromSingleAmount}
                                onAmountChange={(v) => handleUpdateSingleAmount(v)}
                                onExchangeRateChange={(e) => setControlledExchangeRate(e)}
                                remainingBalance={remainingAmount}
                                min={constrainedMin}
                            />
                        );
                    })()}
                </>
            )}

            <div className="w-full mt-4 flex flex-row justify-space-between items-center">
                <span className="block color-weak text-semibold">{c('Wallet send').t`Recipients`}</span>

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
                        <EmailListItem
                            key={recipientUid}
                            index={index}
                            name={recipient.recipient.Name ?? recipient.recipient.Address}
                            address={recipient.recipient.Address}
                            leftNode={
                                txBuilder.getRecipients().length > 1 ? (
                                    <CoreButton
                                        shape="ghost"
                                        color="weak"
                                        className="mr-1 shrink-0 rounded-full"
                                        size="small"
                                        icon
                                        onClick={() => updateTxBuilder((txBuilder) => txBuilder.removeRecipient(index))}
                                    >
                                        <Tooltip title={c('Wallet send').t`Remove email`}>
                                            <Icon
                                                name="cross-circle-filled"
                                                alt={c('Wallet send').t`Remove email`}
                                                className="color-primary"
                                            />
                                        </Tooltip>
                                    </CoreButton>
                                ) : null
                            }
                            rightNode={
                                txBuilder.getRecipients().length > 1 ? (
                                    <div className="w-custom mr-1 shrink-0" style={{ '--w-custom': '7.5rem' }}>
                                        <BitcoinAmountInput
                                            unit={exchangeRate ?? settings.BitcoinUnit}
                                            value={Number(amount)}
                                            onValueChange={(v) => {
                                                tryUpdateRecipientAmount(txBuilderRecipient, index, v);
                                            }}
                                            inputClassName="text-right bg-norm"
                                            min={constrainedMin}
                                        />
                                    </div>
                                ) : null
                            }
                            reviewStep
                        />
                    );
                })}
            </div>

            <div className="px-10 mt-6">
                <Button
                    color="norm"
                    shape="solid"
                    size="large"
                    shadow
                    fullWidth
                    onClick={async () => {
                        if (!(await checkCreatePsbt())) {
                            return;
                        }

                        // Clean recipient with empty amounts
                        txBuilder.getRecipients().forEach((r, i) => {
                            if (!r[2]) {
                                updateTxBuilder((txBuilder) => txBuilder.removeRecipient(i));
                            }
                        });

                        onReview(exchangeRate ?? getExchangeRateFromBitcoinUnit(settings.BitcoinUnit));
                    }}
                    disabled={Boolean(err) || txBuilder.getRecipients().every((r) => !r[2])}
                >{c('Wallet send').t`Review`}</Button>
            </div>
        </div>
    );
};

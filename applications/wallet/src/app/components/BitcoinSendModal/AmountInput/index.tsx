import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, Tooltip } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { useUserWalletSettings } from '@proton/wallet';

import { Button, CoreButton } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { Price } from '../../../atoms/Price';
import { usePsbt } from '../../../hooks/usePsbt';
import type { TxBuilderHelper } from '../../../hooks/useTxBuilder';
import { useExchangeRate } from '../../../store/hooks';
import type { AccountWithChainData } from '../../../types';
import { convertAmount, getAccountBalance, getExchangeRateFromBitcoinUnit } from '../../../utils';
import { useAsyncValue } from '../../../utils/hooks/useAsyncValue';
import { EmailListItem } from '../../EmailListItem';
import type { BtcAddressMap } from '../../EmailOrBitcoinAddressInput/useEmailAndBtcAddressesMaps';
import { BitcoinAmountInputWithBalanceAndCurrencySelect } from './BitcoinAmountInputWithBalanceAndCurrencySelect';

const DEFAULT_MINIMUM_SATS_AMOUNT = 1000;

interface Props {
    txBuilderHelpers: TxBuilderHelper;
    btcAddressMap: BtcAddressMap;
    account: AccountWithChainData;
    apiAccount: WasmApiWalletAccount;
    onBack: () => void;
    onReview: (exchangeRate: WasmApiExchangeRate) => void;
}

const distributeAmount = (amount: number, recipients: number) => {
    const initDistribution = new Array(recipients).fill(0);

    const baseAmount = Math.floor(amount / recipients);
    let remainder = amount % recipients;

    const baseDistribution = initDistribution.map(() => baseAmount);

    for (let i = 0; i < remainder; i++) {
        baseDistribution[i]++;
    }

    return baseDistribution;
};

export const AmountInput = ({ txBuilderHelpers, btcAddressMap, onBack, account, apiAccount, onReview }: Props) => {
    const [defaultExchangeRate] = useExchangeRate(apiAccount.FiatCurrency);
    const [settings] = useUserWalletSettings();

    const { txBuilder, updateTxBuilder, updateTxBuilderAsync } = txBuilderHelpers;

    const [controlledExchangeRate, setControlledExchangeRate] = useState<WasmApiExchangeRate>();
    const { createDraftPsbt } = usePsbt({ txBuilderHelpers });
    const [loadingCreatePsbt, withLoadingCreatePsbt] = useLoading();

    const exchangeRate = controlledExchangeRate ?? defaultExchangeRate;

    const accountBalance = useAsyncValue(getAccountBalance(account), 0);

    const exchangeRateOrBitcoinUnit = exchangeRate ?? settings.BitcoinUnit;

    // Inverted conversion is necessary because SATS conversion to Fiat does not always guarantee a valid amount
    // Supposedly, 1000 SATS = 1,001€, in reality, it is going to be rounded to 1€, so constraint min now becomes 999 SATS
    const constrainedMin = convertAmount(DEFAULT_MINIMUM_SATS_AMOUNT, 'SATS', exchangeRateOrBitcoinUnit);
    const constrainedSatMin = convertAmount(constrainedMin, exchangeRateOrBitcoinUnit, 'SATS');
    const constrainedMinElement = useMemo(
        () => <Price key="min-amount" satsAmount={constrainedSatMin} unit={exchangeRateOrBitcoinUnit} />,
        [constrainedSatMin, exchangeRateOrBitcoinUnit]
    );

    const recipients = useMemo(() => txBuilder.getRecipients(), [txBuilder]);

    const totalSentAmount = recipients.reduce((acc, r) => {
        return acc + Number(r[2]);
    }, 0);

    const [errorMessage, setErrorMessage] = useState<string | any[] | null>(null);
    const checkCreatePsbt = useCallback(async () => {
        const hasRecipientBelowMinAmount = recipients.some((r) => {
            const amount = r[2];
            return amount < constrainedSatMin;
        });

        if (hasRecipientBelowMinAmount) {
            // translators: example: You must send at least $0.50 to each recipient
            return c('Wallet Send').jt`You must send at least ${constrainedMinElement} to each recipient`;
        }

        return createDraftPsbt()
            .then(() => null)
            .catch((err) => {
                switch (err?.kind) {
                    case 'InsufficientFunds':
                        const feesToReserveElement = (
                            <Price key="fees-to-reserve" satsAmount={err.needed - totalSentAmount} unit={'BTC'} />
                        );
                        return c('Wallet send')
                            .jt`You do not have enough BTC in this account to fund the transaction and the required network fee of ${feesToReserveElement}.`;
                    case 'OutputBelowDustLimit':
                        return c('Wallet send').jt`One of recipient's amount is below minimum value`;
                    default:
                        return c('Wallet send').t`Could not create PSBT`;
                }
            });
    }, [constrainedMinElement, constrainedSatMin, createDraftPsbt, recipients, totalSentAmount]);

    useEffect(() => {
        void checkCreatePsbt().then((error) => {
            setErrorMessage(error);
        });
    }, [checkCreatePsbt]);

    const remainingAmount = accountBalance - totalSentAmount;

    const tryUpdateRecipientAmount = (recipientIndex: number, newAmount: number) => {
        updateTxBuilder((txBuilder) => txBuilder.updateRecipient(recipientIndex, undefined, BigInt(newAmount)));
    };

    /**
     * User can update a single amount input, the update amount will be evenly split to every recipient
     */
    const handleUpdateSingleAmount = (newAmount: number) => {
        const distributedAmount = distributeAmount(newAmount, recipients.length);

        recipients.forEach((r, i) => {
            const amount = distributedAmount.at(i) ?? 0;

            const recipientAmount = r[2];
            if (Number(recipientAmount) !== amount) {
                tryUpdateRecipientAmount(i, amount);
            }
        });
    };

    const handleSendAllFromSingleAmount = async () => {
        const distributedAmount = distributeAmount(accountBalance, recipients.length);

        recipients.forEach((r, i) => {
            const amount = distributedAmount.at(i) ?? 0;
            const recipientAmount = r[2];

            if (Number(recipientAmount) !== amount) {
                tryUpdateRecipientAmount(i, amount);
            }
        });

        await updateTxBuilderAsync((txBuilder) => txBuilder.constrainRecipientAmounts());
    };

    const handleReviewTransaction = async () => {
        const errorMessage = await withLoadingCreatePsbt(checkCreatePsbt());
        if (errorMessage) {
            return setErrorMessage(errorMessage);
        }

        // Clean recipient with empty amounts
        recipients.forEach((r, i) => {
            if (!r[2]) {
                updateTxBuilder((txBuilder) => txBuilder.removeRecipient(i));
            }
        });

        onReview(exchangeRate ?? getExchangeRateFromBitcoinUnit(settings.BitcoinUnit));
    };

    return (
        <div className="flex flex-column max-w-full">
            <h2 className="text-center mb-8 text-semibold">{c('Wallet send').t`How much are you sending?`}</h2>

            {recipients.length > 1 ? (
                <>
                    <div className="mb-6">
                        <BitcoinAmountInputWithBalanceAndCurrencySelect
                            exchangeRate={exchangeRate}
                            value={Number(totalSentAmount)}
                            secondaryExchangeRate={defaultExchangeRate}
                            onExchangeRateChange={(e) => setControlledExchangeRate(e)}
                            remainingBalance={remainingAmount}
                            onAmountChange={(v) => handleUpdateSingleAmount(v)}
                            onSendAll={handleSendAllFromSingleAmount}
                            accountBalance={accountBalance}
                        />
                    </div>
                </>
            ) : (
                <>
                    {(() => {
                        const txBuilderRecipients = recipients;
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
                                accountBalance={accountBalance}
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
                {recipients.map((txBuilderRecipient, index) => {
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
                                recipients.length > 1 ? (
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
                                recipients.length > 1 ? (
                                    <div className="w-custom mr-1 shrink-0" style={{ '--w-custom': '7.5rem' }}>
                                        <BitcoinAmountInput
                                            unit={exchangeRateOrBitcoinUnit}
                                            value={Number(amount)}
                                            onValueChange={(v) => {
                                                tryUpdateRecipientAmount(index, v);
                                            }}
                                            inputClassName="text-right bg-norm"
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
                <Tooltip title={errorMessage}>
                    <div>
                        <Button
                            color="norm"
                            shape="solid"
                            size="large"
                            shadow
                            fullWidth
                            onClick={handleReviewTransaction}
                            disabled={!!errorMessage || loadingCreatePsbt}
                        >
                            <div className="flex flex-row items-center justify-center">
                                {c('Wallet send').t`Review`}
                                {loadingCreatePsbt && <CircleLoader className="color-norm ml-1" />}
                            </div>
                        </Button>
                    </div>
                </Tooltip>
                {errorMessage && <div className="mt-4 text-center color-danger">{errorMessage}</div>}
            </div>
        </div>
    );
};

import { useCallback, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount, WasmTxBuilder } from '@proton/andromeda';
import { useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { type SimpleMap } from '@proton/shared/lib/interfaces';
import { COMPUTE_BITCOIN_UNIT } from '@proton/wallet';
import { useExchangeRate, useUserWalletSettings } from '@proton/wallet/store';

import { Price } from '../../../atoms/Price';
import { usePsbt } from '../../../hooks/usePsbt';
import { type TxBuilderHelper } from '../../../hooks/useTxBuilder';
import { type AccountWithChainData } from '../../../types';
import { convertAmount, getAccountBalance, getExchangeRateFromBitcoinUnit } from '../../../utils';

const DEFAULT_MINIMUM_SATS_AMOUNT = 1000;

const distributeAmount = (amount: number, recipients: number) => {
    const initDistribution = new Array(recipients).fill(0);

    const baseAmount = amount / recipients;
    const baseDistribution = initDistribution.map(() => baseAmount);

    return baseDistribution;
};

const constrainAmounts = (recipientAmounts: SimpleMap<number>, accountBalance: number) => {
    let cloned = { ...recipientAmounts };
    let remainingBalance = accountBalance;

    Object.entries(recipientAmounts).forEach(([key, value]) => {
        if (value) {
            /**
             * If r >= a, then r' = r -a and a' = a
             * Else, then r' = 0 and a' = r
             */
            const [constrainedAmount, updatedRemainingBalance] =
                remainingBalance >= value ? [value, remainingBalance - value] : [remainingBalance, 0];
            remainingBalance = updatedRemainingBalance;

            cloned = { ...cloned, [key]: constrainedAmount };
        }
    });

    return cloned;
};

export const useAmountInputStep = ({
    apiAccount,
    txBuilderHelpers,
    account,
    onReview,
}: {
    apiAccount: WasmApiWalletAccount;
    txBuilderHelpers: TxBuilderHelper;
    account: AccountWithChainData;
    onReview: (exchangeRate: WasmApiExchangeRate) => void;
}) => {
    const { createNotification } = useNotifications();
    const [defaultExchangeRate] = useExchangeRate(apiAccount.FiatCurrency);
    const [settings] = useUserWalletSettings();

    const { txBuilder, updateTxBuilder } = txBuilderHelpers;

    const [controlledExchangeRate, setControlledExchangeRate] = useState<WasmApiExchangeRate>();
    const { createDraftPsbt } = usePsbt({ txBuilderHelpers });
    const [loadingCreatePsbt, withLoadingCreatePsbt] = useLoading();

    const exchangeRate = controlledExchangeRate ?? defaultExchangeRate;
    const exchangeRateOrBitcoinUnit = exchangeRate ?? settings.BitcoinUnit;

    const [accountBalance, setAccountBalance] = useState(0);
    useEffect(() => {
        // Get account balance and convert it to the currently selected currency
        void getAccountBalance(account).then((balance) => {
            setAccountBalance(convertAmount(balance, COMPUTE_BITCOIN_UNIT, exchangeRateOrBitcoinUnit));
        });
    }, [account, exchangeRateOrBitcoinUnit]);

    // Inverted conversion is necessary because SATS conversion to Fiat does not always guarantee a valid amount
    // Supposedly, 1000 SATS = 1,001€, in reality, it is going to be rounded to 1€, so constraint min now becomes 999 SATS
    const constrainedMin = convertAmount(DEFAULT_MINIMUM_SATS_AMOUNT, 'SATS', exchangeRateOrBitcoinUnit);
    const constrainedSatMin = convertAmount(constrainedMin, exchangeRateOrBitcoinUnit, 'SATS');
    const constrainedMinElement = useMemo(
        () => <Price key="min-amount" amount={constrainedSatMin} unit={exchangeRateOrBitcoinUnit} />,
        [constrainedSatMin, exchangeRateOrBitcoinUnit]
    );

    const recipients = useMemo(() => txBuilder.getRecipients(), [txBuilder]);
    const [recipientAmounts, setRecipientAmounts] = useState<SimpleMap<number>>({});

    useEffect(() => {
        setRecipientAmounts(
            recipients.reduce(
                (acc: SimpleMap<number>, r) => ({
                    ...acc,
                    [r[0]]: convertAmount(Number(r[2]), COMPUTE_BITCOIN_UNIT, exchangeRateOrBitcoinUnit),
                }),
                {}
            )
        );

        // We only want to set the map on component mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalSentAmount = Object.values(recipientAmounts).reduce((acc: number, amount) => {
        return acc + (amount ?? 0);
    }, 0);

    const checkIsValidTx = useCallback(
        async (txBuilder: WasmTxBuilder) => {
            return createDraftPsbt(txBuilder)
                .then(() => true)
                .catch((err) => {
                    switch (err?.kind) {
                        case 'InsufficientFunds':
                            const feesToReserveElement = (
                                <Price key="fees-to-reserve" amount={err.needed - totalSentAmount} unit={'BTC'} />
                            );

                            createNotification({
                                type: 'error',
                                text: c('Wallet send')
                                    .jt`You do not have enough BTC in this account to fund the transaction and the required network fee of ${feesToReserveElement}.`,
                            });
                            break;

                        case 'OutputBelowDustLimit':
                            createNotification({
                                type: 'error',
                                text: c('Wallet send').jt`One of recipient's amount is below minimum value`,
                            });
                            break;

                        default:
                            createNotification({
                                type: 'error',
                                text: c('Wallet send').t`Could not create PSBT`,
                            });
                            break;
                    }

                    return false;
                });
        },
        [createDraftPsbt, createNotification, totalSentAmount]
    );

    const recipientBelowMinAmountError = useMemo(() => {
        return Object.values(recipientAmounts).some((amount) => {
            return convertAmount(amount ?? 0, exchangeRateOrBitcoinUnit, COMPUTE_BITCOIN_UNIT) < constrainedSatMin;
        })
            ? // translators: example: You must send at least $0.50 to each recipient
              c('Wallet Send').jt`You must send at least ${constrainedMinElement} to each recipient`
            : null;
    }, [constrainedMinElement, constrainedSatMin, exchangeRateOrBitcoinUnit, recipientAmounts]);

    const remainingAmount = accountBalance - totalSentAmount;

    /**
     * User can update a single amount input or send all button, the update amount will be evenly split to every recipient
     */
    const handleSendFromSingleAmount = async (newAmount?: number) => {
        const amountToDistribute = newAmount ?? accountBalance;
        const distributedAmount = distributeAmount(amountToDistribute, recipients.length);

        setRecipientAmounts((prev) => {
            return constrainAmounts(
                recipients.reduce((acc, r, i) => ({ ...acc, [r[0]]: distributedAmount[i] }), prev),
                accountBalance
            );
        });
    };

    const handleUpdateRecipientAmount = (recipientUid: string, value: number) => {
        setRecipientAmounts((prev) => constrainAmounts({ ...prev, [recipientUid]: value }, accountBalance));
    };

    const handleExchangeRateChange = (newExchangeRate: WasmApiExchangeRate) => {
        setRecipientAmounts((prev) => {
            return Object.entries(prev).reduce(
                (acc, [key, value]) => ({
                    ...acc,
                    [key]: value ? convertAmount(value, exchangeRateOrBitcoinUnit, newExchangeRate) : undefined,
                }),
                prev
            );
        });
        setControlledExchangeRate(newExchangeRate);
    };

    const handleReviewTransaction = async () => {
        // Clean recipient with empty amounts
        const updatedTxBuilder = Object.entries(recipientAmounts).reduce((txB, [, recipientAmount], index) => {
            return recipientAmount
                ? txB.updateRecipient(
                      index,
                      undefined,
                      BigInt(convertAmount(recipientAmount, exchangeRateOrBitcoinUnit, COMPUTE_BITCOIN_UNIT))
                  )
                : txB.removeRecipient(index);
        }, txBuilder);

        // We constrain to make sure outputs are below inputs
        const contrained = await updatedTxBuilder.constrainRecipientAmounts();

        // We check tx validity
        const isValid = await withLoadingCreatePsbt(checkIsValidTx(contrained));
        if (!isValid) {
            return;
        }

        // We commit the changes to the txbuilder
        updateTxBuilder(() => contrained);
        onReview(exchangeRate ?? getExchangeRateFromBitcoinUnit(settings.BitcoinUnit));
    };

    return {
        recipients,
        recipientAmounts,

        exchangeRate,
        totalSentAmount,
        loadingCreatePsbt,
        recipientBelowMinAmountError,
        remainingAmount,
        defaultExchangeRate,
        accountBalance,
        exchangeRateOrBitcoinUnit,

        handleSendFromSingleAmount,
        handleUpdateRecipientAmount,
        handleExchangeRateChange,
        handleReviewTransaction,
    };
};

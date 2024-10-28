import { c } from 'ttag';

import type { WasmApiExchangeRate, WasmApiWalletAccount } from '@proton/andromeda';
import { CircleLoader } from '@proton/atoms';
import { Icon, Tooltip } from '@proton/components';

import { Button, CoreButton } from '../../../atoms';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import type { TxBuilderHelper } from '../../../hooks/useTxBuilder';
import type { AccountWithChainData } from '../../../types';
import { EmailListItem } from '../../EmailListItem';
import type { BtcAddressMap } from '../useEmailAndBtcAddressesMaps';
import { BitcoinAmountInputWithBalanceAndCurrencySelect } from './BitcoinAmountInputWithBalanceAndCurrencySelect';
import { useAmountInputStep } from './useAmountInputStep';

interface Props {
    txBuilderHelpers: TxBuilderHelper;
    btcAddressMap: BtcAddressMap;
    account: AccountWithChainData;
    apiAccount: WasmApiWalletAccount;
    onBack: () => void;
    onReview: (exchangeRate: WasmApiExchangeRate) => void;
}

export const AmountInputStep = ({ txBuilderHelpers, btcAddressMap, onBack, account, apiAccount, onReview }: Props) => {
    const {
        recipients,
        recipientAmounts,
        exchangeRate,
        totalSentAmount,
        defaultExchangeRate,
        accountBalance,
        loadingCreatePsbt,
        recipientBelowMinAmountError,
        remainingAmount,
        exchangeRateOrBitcoinUnit,
        handleSendFromSingleAmount,
        handleReviewTransaction,
        handleExchangeRateChange,
        handleUpdateRecipientAmount,
    } = useAmountInputStep({
        account,
        apiAccount,
        txBuilderHelpers,
        onReview,
    });

    return (
        <div className="flex flex-column max-w-full">
            <h2 className="text-center mb-8 text-semibold">{c('Wallet send').t`How much are you sending?`}</h2>

            {recipients.length > 1 ? (
                <div className="mb-6">
                    <BitcoinAmountInputWithBalanceAndCurrencySelect
                        exchangeRate={exchangeRate}
                        value={Number(totalSentAmount)}
                        secondaryExchangeRate={defaultExchangeRate}
                        onExchangeRateChange={handleExchangeRateChange}
                        remainingBalance={remainingAmount}
                        onAmountChange={(v) => handleSendFromSingleAmount(v)}
                        onSendAll={handleSendFromSingleAmount}
                        accountBalance={accountBalance}
                    />
                </div>
            ) : (
                (() => {
                    const firstRecipientAmount = Object.values(recipientAmounts).at(0);

                    return (
                        <BitcoinAmountInputWithBalanceAndCurrencySelect
                            exchangeRate={exchangeRate}
                            value={firstRecipientAmount ?? 0}
                            secondaryExchangeRate={defaultExchangeRate}
                            onAmountChange={(v) => handleSendFromSingleAmount(v)}
                            onSendAll={handleSendFromSingleAmount}
                            onExchangeRateChange={handleExchangeRateChange}
                            remainingBalance={remainingAmount}
                            accountBalance={accountBalance}
                        />
                    );
                })()
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

                    const amount = recipientAmounts[recipientUid] ?? 0;

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
                                        onClick={() =>
                                            txBuilderHelpers.updateTxBuilder((txBuilder) =>
                                                txBuilder.removeRecipient(index)
                                            )
                                        }
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
                                            value={amount}
                                            onValueChange={(value) => {
                                                handleUpdateRecipientAmount(recipientUid, value);
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
                <Tooltip title={recipientBelowMinAmountError}>
                    <div>
                        <Button
                            color="norm"
                            shape="solid"
                            size="large"
                            shadow
                            fullWidth
                            onClick={handleReviewTransaction}
                            disabled={!!recipientBelowMinAmountError || loadingCreatePsbt}
                        >
                            <div className="flex flex-row items-center justify-center">
                                {c('Wallet send').t`Review`}
                                {loadingCreatePsbt && <CircleLoader className="color-norm ml-1" />}
                            </div>
                        </Button>
                    </div>
                </Tooltip>
                {recipientBelowMinAmountError && (
                    <div className="mt-4 text-center color-danger">{recipientBelowMinAmountError}</div>
                )}
            </div>
        </div>
    );
};

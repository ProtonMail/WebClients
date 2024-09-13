import { useState } from 'react';

import { c } from 'ttag';

import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { type PaymentMethodStatusExtended } from '@proton/payments';
import { isNumber } from '@proton/shared/lib/helpers/validators';
import type { Currency } from '@proton/shared/lib/interfaces';

import { Input, Label } from '../../components';
import { useSubscription, useUser } from '../../hooks';
import AmountButton from './AmountButton';
import CurrencySelector from './CurrencySelector';

interface Props {
    currency: Currency;
    amount: number;
    onChangeCurrency: (currency: Currency) => void;
    onChangeAmount: (amount: number) => void;
    maxAmount?: number;
    minAmount?: number;
    disableCurrencySelector: boolean;
    status: PaymentMethodStatusExtended;
}

const PaymentSelector = ({
    currency,
    amount,
    onChangeCurrency,
    onChangeAmount,
    minAmount,
    maxAmount,
    disableCurrencySelector,
    status,
}: Props) => {
    const [subscription] = useSubscription();
    const [user] = useUser();
    const { getAvailableCurrencies } = useCurrencies();

    const [inputValue, setInputValue] = useState('');

    const getCurrencyRate = (currency: Currency) => {
        if (currency === 'BRL') {
            return 5;
        }

        return 1;
    };

    const getAmounts = (currency: Currency) => {
        const defaultAmounts = [500, 1000, 5000, 10000];
        const rate = getCurrencyRate(currency);
        return defaultAmounts.map((value) => Math.floor(value * rate));
    };

    const handleChangeAmount = (value: number) => {
        setInputValue('');
        onChangeAmount(value);
    };

    const handleChangeCurrency = (newCurrency: Currency) => {
        onChangeCurrency(newCurrency);

        if (getCurrencyRate(newCurrency) !== getCurrencyRate(currency)) {
            const newAmounts = getAmounts(newCurrency);
            // select the lowest amount
            handleChangeAmount(newAmounts[0]);
        }
    };

    const amounts = getAmounts(currency);

    return (
        <>
            <div className="flex gap-4 justify-space-between mb-4 flex-column md:flex-row">
                {amounts.map((value) => (
                    <div key={value} className="md:flex-1 mb-2 md:mb-0">
                        <AmountButton
                            aria-describedby="id_desc_amount id_desc_currency"
                            className="w-full"
                            onSelect={handleChangeAmount}
                            value={value}
                            amount={amount}
                        />
                    </div>
                ))}
            </div>
            <div className="flex gap-4 justify-space-between flex-column md:flex-row">
                <div className="md:flex-1 mb-2 md:mb-0">
                    <Label htmlFor="otherAmount" className="sr-only">{c('Label').t`Other amount`}</Label>
                    <Input
                        className="w-full"
                        onChange={({ target }) => {
                            if (target.value === '') {
                                setInputValue('');
                                onChangeAmount(0);
                                return;
                            }
                            if (!isNumber(target.value)) {
                                return;
                            }
                            const value = Number(target.value);
                            if (minAmount && value < minAmount / 100) {
                                return;
                            }
                            if (maxAmount && value > maxAmount / 100) {
                                return;
                            }
                            setInputValue(`${value}`);
                            onChangeAmount(Math.floor(value * 100));
                        }}
                        onBlur={() => {
                            setInputValue(`${amount / 100}`);
                        }}
                        value={inputValue}
                        id="otherAmount"
                        placeholder={c('Placeholder').t`Other`}
                        aria-describedby="id_desc_amount id_desc_currency"
                        data-testid="other-amount"
                    />
                </div>
                <div className="md:flex-1 mb-2 md:mb-0">
                    <CurrencySelector
                        currencies={getAvailableCurrencies({ status, user, subscription })}
                        mode="select-two"
                        className="w-full"
                        id="id_desc_currency"
                        currency={currency}
                        onSelect={handleChangeCurrency}
                        disabled={disableCurrencySelector}
                    />
                </div>
            </div>
        </>
    );
};

export default PaymentSelector;

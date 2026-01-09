import { useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import Input from '@proton/components/components/input/Input';
import Label from '@proton/components/components/label/Label';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import { type Currency, type PaymentStatus, getNaiveCurrencyRate } from '@proton/payments';
import { getCurrencyFormattingConfig } from '@proton/payments/core/currencies';
import { isNumber } from '@proton/shared/lib/helpers/validators';

import AmountButton from './AmountButton';
import CurrencySelector from './CurrencySelector';

interface Props {
    currency: Currency;
    amount: number;
    onChangeCurrency: (currency: Currency) => void;
    onChangeAmount: (amount: number) => void;
    disableCurrencySelector: boolean;
    paymentStatus: PaymentStatus;
}

const PaymentSelector = ({
    currency,
    amount,
    onChangeCurrency,
    onChangeAmount,
    disableCurrencySelector,
    paymentStatus,
}: Props) => {
    const [subscription] = useSubscription();
    const [user] = useUser();
    const { getAvailableCurrencies } = useCurrencies();

    const [inputValue, setInputValue] = useState('');

    const { divisor } = getCurrencyFormattingConfig(currency);

    const getAmounts = (currency: Currency) => {
        const defaultUsdAmounts = [500, 1000, 5000, 10000];
        const rate = getNaiveCurrencyRate(currency);
        return defaultUsdAmounts.map((value) => Math.floor(value * rate));
    };

    const handleChangeAmount = (value: number) => {
        setInputValue('');
        onChangeAmount(value);
    };

    const handleChangeCurrency = (newCurrency: Currency) => {
        onChangeCurrency(newCurrency);
        setInputValue('');

        // select the lowest amount
        const newAmounts = getAmounts(newCurrency);
        handleChangeAmount(newAmounts[0]);
    };

    const amounts = getAmounts(currency);

    return (
        <>
            <div className="flex gap-4 justify-space-between mb-4 flex-column md:flex-row">
                {amounts.map((value) => (
                    <div key={value} className="md:flex-1 mb-2 md:mb-0">
                        <AmountButton
                            currency={currency}
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
                            setInputValue(`${value}`);
                            onChangeAmount(Math.floor(value * divisor));
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
                        currencies={getAvailableCurrencies({ paymentStatus, user, subscription })}
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

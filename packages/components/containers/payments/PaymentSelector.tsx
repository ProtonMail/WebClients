import { useState } from 'react';

import { c } from 'ttag';

import { isNumber } from '@proton/shared/lib/helpers/validators';
import { Currency } from '@proton/shared/lib/interfaces';

import { Input, Label } from '../../components';
import AmountButton from './AmountButton';
import CurrencySelector from './CurrencySelector';

interface Props {
    currency?: Currency;
    amount: number;
    onChangeCurrency: (currency: Currency) => void;
    onChangeAmount: (amount: number) => void;
    maxAmount?: number;
    minAmount?: number;
}

const PaymentSelector = ({ currency, amount, onChangeCurrency, onChangeAmount, minAmount, maxAmount }: Props) => {
    const [inputValue, setInputValue] = useState('');

    const handleButton = (value: number) => {
        setInputValue('');
        onChangeAmount(value);
    };

    return (
        <>
            <div className="flex gap-4 flex-justify-space-between mb-4 on-mobile-flex-column">
                <div className="flex-item-fluid mb-2 md:mb-0">
                    <AmountButton
                        aria-describedby="id_desc_amount id_desc_currency"
                        className="w100"
                        onSelect={handleButton}
                        value={500}
                        amount={amount}
                    />
                </div>
                <div className="flex-item-fluid mb-2 md:mb-0">
                    <AmountButton
                        aria-describedby="id_desc_amount id_desc_currency"
                        className="w100"
                        onSelect={handleButton}
                        value={1000}
                        amount={amount}
                    />
                </div>
                <div className="flex-item-fluid mb-2 md:mb-0">
                    <AmountButton
                        aria-describedby="id_desc_amount id_desc_currency"
                        className="w100"
                        onSelect={handleButton}
                        value={5000}
                        amount={amount}
                    />
                </div>
                <div className="flex-item-fluid mb-2 md:mb-0">
                    <AmountButton
                        aria-describedby="id_desc_amount id_desc_currency"
                        className="w100"
                        onSelect={handleButton}
                        value={10000}
                        amount={amount}
                    />
                </div>
            </div>
            <div className="flex gap-4 flex-justify-space-between on-mobile-flex-column">
                <div className="flex-item-fluid mb-2 md:mb-0">
                    <Label htmlFor="otherAmount" className="sr-only">{c('Label').t`Other amount`}</Label>
                    <Input
                        className="w100"
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
                    />
                </div>
                <div className="flex-item-fluid mb-2 md:mb-0">
                    <CurrencySelector
                        mode="select-two"
                        className="w100"
                        id="id_desc_currency"
                        currency={currency}
                        onSelect={onChangeCurrency}
                    />
                </div>
            </div>
        </>
    );
};

export default PaymentSelector;

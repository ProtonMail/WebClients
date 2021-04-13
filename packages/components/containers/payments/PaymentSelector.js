import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { isNumber } from 'proton-shared/lib/helpers/validators';

import { Input, Label } from '../../components';
import CurrencySelector from './CurrencySelector';
import AmountButton from './AmountButton';

const PaymentSelector = ({ currency, amount, onChangeCurrency, onChangeAmount, minAmount, maxAmount }) => {
    const [inputValue, setInputValue] = useState('');

    const handleButton = (value) => {
        setInputValue('');
        onChangeAmount(value);
    };
    const handleChange = ({ target }) => {
        if (target.value && !isNumber(target.value)) {
            return;
        }
        if (minAmount && target.value < minAmount / 100) {
            return;
        }
        if (maxAmount && target.value > maxAmount / 100) {
            return;
        }
        setInputValue(target.value);
        onChangeAmount(Math.floor(target.value * 100));
    };
    const handleBlur = () => {
        setInputValue(amount / 100);
    };

    return (
        <>
            <div className="flex-autogrid on-mobile-flex-column">
                <div className="flex-autogrid-item on-mobile-mb0-5">
                    <AmountButton className="w100" onSelect={handleButton} value={500} amount={amount} />
                </div>
                <div className="flex-autogrid-item on-mobile-mb0-5">
                    <AmountButton className="w100" onSelect={handleButton} value={1000} amount={amount} />
                </div>
                <div className="flex-autogrid-item on-mobile-mb0-5">
                    <AmountButton className="w100" onSelect={handleButton} value={5000} amount={amount} />
                </div>
                <div className="flex-autogrid-item on-mobile-mb0-5">
                    <AmountButton className="w100" onSelect={handleButton} value={10000} amount={amount} />
                </div>
            </div>
            <div className="flex-autogrid on-mobile-flex-column">
                <div className="flex-autogrid-item on-mobile-mb0-5">
                    <Label htmlFor="otherAmount" className="sr-only">{c('Label').t`Other amount`}</Label>
                    <Input
                        className="w100"
                        onChange={handleChange}
                        onBlur={handleBlur}
                        value={inputValue}
                        id="otherAmount"
                        placeholder={c('Placeholder').t`Other`}
                    />
                </div>
                <div className="flex-autogrid-item on-mobile-mb0-5">
                    <CurrencySelector className="w100" currency={currency} onSelect={onChangeCurrency} />
                </div>
            </div>
        </>
    );
};

PaymentSelector.propTypes = {
    currency: PropTypes.string.isRequired,
    minAmount: PropTypes.number,
    maxAmount: PropTypes.number,
    amount: PropTypes.number.isRequired,
    onChangeCurrency: PropTypes.func.isRequired,
    onChangeAmount: PropTypes.func.isRequired,
};

export default PaymentSelector;

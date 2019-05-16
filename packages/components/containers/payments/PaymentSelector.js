import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-components';
import { c } from 'ttag';

import CurrencySelector from './CurrencySelector';
import AmountButton from './AmountButton';

const PaymentSelector = ({ currency, amount, onChangeCurrency, onChangeAmount }) => {
    const handleChange = ({ target }) => onChangeAmount(target.value * 100);

    return (
        <>
            <div className="flex-autogrid onmobile-flex-column">
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={500} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={1000} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={5000} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={10000} amount={amount} />
                </div>
            </div>
            <div className="flex-autogrid onmobile-flex-column">
                <div className="flex-autogrid-item">
                    <Input className="w100" onChange={handleChange} placeholder={c('Placeholder').t`Other`} />
                </div>
                <div className="flex-autogrid-item">
                    <CurrencySelector className="w100" currency={currency} onSelect={onChangeCurrency} />
                </div>
            </div>
        </>
    );
};

PaymentSelector.propTypes = {
    currency: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    onChangeCurrency: PropTypes.func.isRequired,
    onChangeAmount: PropTypes.func.isRequired
};

export default PaymentSelector;

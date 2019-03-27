import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-components';

import CurrencySelector from './CurrencySelector';
import AmountButton from './AmountButton';

const PaymentSelector = ({ currency, amount, onChangeCurrency, onChangeAmount }) => {
    const handleChange = ({ target }) => onChangeAmount(target.value * 100);

    return (
        <>
            <div className="flex-autogrid onmobile-flex-column">
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={5} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={10} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={25} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={50} amount={amount} />
                </div>
            </div>
            <div className="flex-autogrid onmobile-flex-column">
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={100} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={onChangeAmount} value={250} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <Input className="w100" onChange={handleChange} />
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

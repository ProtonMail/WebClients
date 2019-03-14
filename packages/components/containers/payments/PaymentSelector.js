import React from 'react';
import PropTypes from 'prop-types';
import { Input } from 'react-components';

import CurrencySelector from './CurrencySelector';
import AmountButton from './AmountButton';

const PaymentSelector = ({ currency, amount, setCurrency, setAmount }) => {
    const handleChange = ({ target }) => setAmount(target.value * 100);

    return (
        <>
            <div className="flex-autogrid onmobile-flex-column">
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={setAmount} value={5} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={setAmount} value={10} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={setAmount} value={25} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={setAmount} value={50} amount={amount} />
                </div>
            </div>
            <div className="flex-autogrid onmobile-flex-column">
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={setAmount} value={100} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <AmountButton className="w100" onSelect={setAmount} value={250} amount={amount} />
                </div>
                <div className="flex-autogrid-item">
                    <Input className="w100" onChange={handleChange} />
                </div>
                <div className="flex-autogrid-item">
                    <CurrencySelector className="w100" currency={currency} onSelect={setCurrency} />
                </div>
            </div>
        </>
    );
};

PaymentSelector.propTypes = {
    currency: PropTypes.string.isRequired,
    amount: PropTypes.number.isRequired,
    setCurrency: PropTypes.func.isRequired,
    setAmount: PropTypes.func.isRequired
};

export default PaymentSelector;

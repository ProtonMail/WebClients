import React from 'react';
import PropTypes from 'prop-types';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF'
};

const Price = ({ children: amount = 0, currency = '', className = '', divisor }) => {
    const symbol = CURRENCIES[currency] || currency;
    const value = Number(amount / divisor).toFixed(2);
    const prefix = value < 0 ? '-' : '';
    const absValue = Math.abs(value);

    return (
        <span className={`price ${className}`}>
            {currency === 'USD' ? `${prefix}${symbol}${absValue}` : `${prefix}${absValue} ${symbol}`}
        </span>
    );
};

Price.propTypes = {
    currency: PropTypes.string,
    children: PropTypes.number.isRequired,
    className: PropTypes.string,
    divisor: PropTypes.number.isRequired
};

Price.defaultProps = {
    className: '',
    children: 0,
    divisor: 100
};

export default Price;

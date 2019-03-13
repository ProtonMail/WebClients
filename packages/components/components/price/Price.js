import React from 'react';
import PropTypes from 'prop-types';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF'
};

const Price = ({ children: amount = 0, currency = '', className = '' }) => {
    const symbol = CURRENCIES[currency] || currency;
    const value = Number(amount).toFixed(2);
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
    className: PropTypes.string
};

export default Price;

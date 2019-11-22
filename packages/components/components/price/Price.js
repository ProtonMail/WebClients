import React from 'react';
import PropTypes from 'prop-types';
import { classnames } from '../../helpers/component';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF'
};

const Price = ({ children: amount = 0, currency = '', className = '', divisor = 100, suffix = '' }) => {
    const fixedValue = Number(amount / divisor).toFixed(2);
    const absValue = Math.abs(fixedValue);
    const value = ~~fixedValue === absValue ? absValue : fixedValue;
    const c = <span className="currency">{CURRENCIES[currency] || currency}</span>;
    const p = value < 0 ? <span className="prefix">-</span> : null;
    const v = <span className="amount">{value}</span>;
    const s = suffix ? <span className="suffix">{suffix}</span> : null;

    if (currency === 'USD') {
        return (
            <span className={classnames(['price', className])} data-currency={currency}>
                {p}
                {c}
                {v}
                {s}
            </span>
        ); // -$2/month
    }

    return (
        <span className={classnames(['price', className])} data-currency={currency}>
            {p}
            {v}
            {currency ? <> {c}</> : null}
            {s}
        </span>
    ); // -2 EUR/month
};

Price.propTypes = {
    currency: PropTypes.string,
    children: PropTypes.number,
    className: PropTypes.string,
    divisor: PropTypes.number,
    suffix: PropTypes.string
};

export default Price;

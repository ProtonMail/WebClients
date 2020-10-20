import React from 'react';
import PropTypes from 'prop-types';
import humanPrice from 'proton-shared/lib/helpers/humanPrice';

import { classnames } from '../../helpers';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF',
};

const Price = ({ children: amount = 0, currency = '', className = '', divisor = 100, suffix = '', prefix = '' }) => {
    const value = humanPrice(amount, divisor);
    const [integer, decimal] = `${value}`.split('.');
    const c = <span className="currency">{CURRENCIES[currency] || currency}</span>;
    const p = amount < 0 ? <span className="prefix">-</span> : null;
    const v = (
        <span className="amount">
            <span className="integer">{integer}</span>
            {decimal ? <span className="decimal">.{decimal}</span> : null}
        </span>
    );
    const s = suffix ? <span className="suffix ml0-25">{suffix}</span> : null;
    const pr = prefix ? <span className="prefix">{prefix}</span> : null;

    if (currency === 'USD') {
        return (
            <span className={classnames(['price flex-item-noshrink inline-flex', className])} data-currency={currency}>
                {pr}
                {p}
                {c}
                {v}
                {s}
            </span>
        ); // -$2/month
    }

    return (
        <span className={classnames(['price flex-item-noshrink inline-flex', className])} data-currency={currency}>
            {pr}
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
    suffix: PropTypes.string,
    prefix: PropTypes.string,
};

export default Price;

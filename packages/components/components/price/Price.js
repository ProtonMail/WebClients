import React from 'react';
import PropTypes from 'prop-types';
import { toPrice } from 'proton-shared/lib/helpers/string';

const Price = ({ children: amount = 0, currency = '', className = '', divisor = 100, suffix = '' }) => {
    return <span className={`price ${className}`}>{`${toPrice(amount, currency, divisor)} ${suffix}`.trim()}</span>;
};

Price.propTypes = {
    currency: PropTypes.string,
    children: PropTypes.number,
    className: PropTypes.string,
    divisor: PropTypes.number,
    suffix: PropTypes.string
};

export default Price;

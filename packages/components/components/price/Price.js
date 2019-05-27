import React from 'react';
import PropTypes from 'prop-types';
import { toPrice } from 'proton-shared/lib/helpers/string';

const Price = ({ children: amount, currency, className, divisor, suffix }) => {
    return <span className={`price ${className}`}>{`${toPrice(amount, currency, divisor)} ${suffix}`.trim()}</span>;
};

Price.propTypes = {
    currency: PropTypes.string,
    children: PropTypes.number.isRequired,
    className: PropTypes.string,
    divisor: PropTypes.number.isRequired,
    suffix: PropTypes.string
};

Price.defaultProps = {
    className: '',
    currency: '',
    suffix: '',
    children: 0,
    divisor: 100
};

export default Price;

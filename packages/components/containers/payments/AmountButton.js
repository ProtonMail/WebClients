import React from 'react';
import PropTypes from 'prop-types';
import { Button, Price } from 'react-components';

const AmountButton = ({ value, amount, currency, onSelect, className }) => {
    return (
        <Button className={`${className} ${value === amount ? 'is-active' : ''}`} onClick={() => onSelect(value)}>
            <Price currency={currency}>{value}</Price>
        </Button>
    );
};

AmountButton.propTypes = {
    value: PropTypes.number.isRequired,
    amount: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    currency: PropTypes.string,
    className: PropTypes.string
};

AmountButton.defaultProps = {
    value: 0,
    amount: 0,
    className: ''
};

export default AmountButton;

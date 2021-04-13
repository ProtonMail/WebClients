import React from 'react';
import PropTypes from 'prop-types';
import { Button, Price } from '../../components';
import { classnames } from '../../helpers';

const AmountButton = ({ value = 0, amount = 0, currency, onSelect, className = '' }) => {
    return (
        <Button
            aria-pressed={value === amount}
            className={classnames([className, value === amount && 'is-active'])}
            onClick={() => onSelect(value)}
        >
            <Price currency={currency}>{value}</Price>
        </Button>
    );
};

AmountButton.propTypes = {
    value: PropTypes.number,
    amount: PropTypes.number,
    onSelect: PropTypes.func.isRequired,
    currency: PropTypes.string,
    className: PropTypes.string,
};

export default AmountButton;

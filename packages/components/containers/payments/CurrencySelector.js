import React from 'react';
import PropTypes from 'prop-types';
import { CURRENCIES, DEFAULT_CURRENCY } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { Select, ButtonGroup, Button } from '../../components';
import { classnames } from '../../helpers';

const addSymbol = (currency) => {
    if (currency === 'EUR') {
        return `€ ${currency}`;
    }

    if (currency === 'USD') {
        return `$ ${currency}`;
    }

    return currency;
};

const CurrencySelector = ({ currency = DEFAULT_CURRENCY, onSelect, mode = 'select', ...rest }) => {
    const handleChange = ({ target }) => onSelect(target.value);
    const options = CURRENCIES.map((c) => ({ text: c, value: c }));

    if (mode === 'buttons') {
        return (
            <ButtonGroup {...rest}>
                {options.map(({ text, value }) => {
                    return (
                        <Button
                            group
                            className={classnames([currency === value && 'is-active'])}
                            key={value}
                            onClick={() => onSelect(value)}
                        >
                            {text}
                        </Button>
                    );
                })}
            </ButtonGroup>
        );
    }

    if (mode === 'select') {
        return (
            <Select
                title={c('Title').t`Currency`}
                value={currency}
                options={options.map((option) => ({ ...option, text: addSymbol(option.text) }))}
                onChange={handleChange}
                {...rest}
            />
        );
    }

    return null;
};

CurrencySelector.propTypes = {
    mode: PropTypes.oneOf(['select', 'buttons']),
    currency: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
};

export default CurrencySelector;

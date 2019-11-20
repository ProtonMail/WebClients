import React from 'react';
import PropTypes from 'prop-types';
import { Select, Group, ButtonGroup } from 'react-components';
import { CURRENCIES, DEFAULT_CURRENCY } from 'proton-shared/lib/constants';
import { classnames } from '../../helpers/component';

const CurrencySelector = ({ currency = DEFAULT_CURRENCY, onSelect, mode = 'select', ...rest }) => {
    const handleChange = ({ target }) => onSelect(target.value);
    const options = CURRENCIES.map((c) => ({ text: c, value: c }));

    if (mode === 'buttons') {
        return (
            <Group {...rest}>
                {options.map(({ text, value }) => {
                    return (
                        <ButtonGroup
                            className={classnames([currency === value && 'is-active'])}
                            key={value}
                            onClick={() => onSelect(value)}
                        >
                            {text}
                        </ButtonGroup>
                    );
                })}
            </Group>
        );
    }

    if (mode === 'select') {
        return <Select value={currency} options={options} onChange={handleChange} {...rest} />;
    }

    return null;
};

CurrencySelector.propTypes = {
    mode: PropTypes.oneOf(['select', 'buttons']),
    currency: PropTypes.string,
    onSelect: PropTypes.func.isRequired
};

export default CurrencySelector;

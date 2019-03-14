import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';
import { CURRENCIES } from 'proton-shared/lib/constants';

const CurrencySelector = ({ currency, onSelect, ...rest }) => {
    const handleChange = ({ target }) => onSelect(target.value);
    const options = CURRENCIES.map((c) => ({ text: c, value: c }));

    return <Select value={currency} options={options} onChange={handleChange} {...rest} />;
};

CurrencySelector.propTypes = {
    currency: PropTypes.string.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default CurrencySelector;

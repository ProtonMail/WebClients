import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'react-components';

const VerificationMethodSelector = ({ allowedMethods, method, onSelect, ...rest }) => {
    const handleChange = ({ target }) => onSelect(target.value);
    const options = allowedMethods.map((c) => ({ text: c, value: c }));

    return <Select value={method} options={options} onChange={handleChange} {...rest} />;
};

VerificationMethodSelector.propTypes = {
    allowedMethods: PropTypes.arrayOf(PropTypes.string).isRequired,
    method: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
};

export default VerificationMethodSelector;

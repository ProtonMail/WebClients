import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';
import { isNumber } from '../../helpers/validators';

const TwoFactorInput = ({ value, onChange, maxLength, ...rest }) => {
    const handleChange = (event) => {
        const { value = '' } = event.target;

        if (isNumber(value) && value.length <= maxLength) {
            onChange(event);
        }
    };

    return <Input value={value} onChange={handleChange} {...rest} />;
};

TwoFactorInput.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.string,
    maxLength: PropTypes.number.isRequired
};

TwoFactorInput.defaultProps = {
    maxLength: 6
};

export default TwoFactorInput;

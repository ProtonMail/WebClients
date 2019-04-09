import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';
import { isNumber } from '../../helpers/validators';

const TwoFaInput = ({ value, onChange, maxLength, ...rest }) => {
    const handleChange = (event) => {
        const { value = '' } = event.target;

        if (isNumber(value) && value.length <= maxLength) {
            onChange(event);
        }
    };

    return <Input value={value} onChange={handleChange} {...rest} />;
};

TwoFaInput.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.number,
    maxLength: PropTypes.number.isRequired
};

TwoFaInput.defaultProps = {
    maxLength: 6
};

export default TwoFaInput;

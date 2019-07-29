import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';

/**
 * The two-factor input needs to support recovery codes and totp codes.
 * e.g. 0fac27c3 and 505037.
 */
const TwoFactorInput = ({ value, onChange, maxLength = 8, ...rest }) => {
    return <Input value={value} onChange={onChange} maxLength={maxLength} {...rest} />;
};

TwoFactorInput.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.string,
    maxLength: PropTypes.number.isRequired
};

export default TwoFactorInput;

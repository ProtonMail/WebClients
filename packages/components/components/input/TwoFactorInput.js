import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';

/**
 * The two-factor input needs to support recovery codes and totp codes.
 * e.g. 0fac27c3 and 505037.
 */
const TwoFactorInput = ({ value, onChange, ...rest }) => {
    return <Input value={value} onChange={onChange} {...rest} />;
};

TwoFactorInput.propTypes = {
    onChange: PropTypes.func,
    value: PropTypes.string,
    maxLength: PropTypes.number.isRequired
};

TwoFactorInput.defaultProps = {
    maxLength: 8
};

export default TwoFactorInput;

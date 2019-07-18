import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';

import Input from './Input';
import { isEmail } from 'proton-shared/lib/helpers/validators';

const EmailInput = ({ value, ...rest }) => {
    const error = isEmail(value) ? '' : c('Error').t`Email address invalid`;
    return <Input type="email" error={error} value={value} {...rest} />;
};

EmailInput.propTypes = {
    value: PropTypes.string
};

EmailInput.defaultProps = {
    value: ''
};

export default EmailInput;

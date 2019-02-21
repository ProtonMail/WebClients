import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';

const Checkbox = ({ checked, ...rest }) => <Input type="checkbox" checked={checked} {...rest} />;

Checkbox.propTypes = {
    checked: PropTypes.bool.isRequired
};

export default Checkbox;
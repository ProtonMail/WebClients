import React from 'react';
import PropTypes from 'prop-types';
import Button from './Button';

const ResetButton = ({ children, ...rest }) => <Button type="reset" {...rest}>{children}</Button>;

ResetButton.propTypes = {
    children: PropTypes.node.isRequired
};

export default ResetButton;
import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';

const ErrorButton = ({ children, className, ...rest }) => {
    return (
        <Button className={`pm-button--error ${className}`} {...rest}>
            {children}
        </Button>
    );
};

ErrorButton.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

ErrorButton.defaultProps = {
    className: ''
};

export default ErrorButton;

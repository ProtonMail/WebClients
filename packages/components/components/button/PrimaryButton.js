import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';

const PrimaryButton = ({ children, className, ...rest }) => {
    return (
        <Button className={`pm-button--primary ${className}`} {...rest}>
            {children}
        </Button>
    );
};

PrimaryButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

PrimaryButton.defaultProps = {
    className: ''
};

export default PrimaryButton;

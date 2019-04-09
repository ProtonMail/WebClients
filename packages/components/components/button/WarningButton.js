import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';

const WarningButton = ({ children, className, ...rest }) => {
    return (
        <Button className={`pm-button--warning ${className}`} {...rest}>
            {children}
        </Button>
    );
};

WarningButton.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

WarningButton.defaultProps = {
    className: ''
};

export default WarningButton;

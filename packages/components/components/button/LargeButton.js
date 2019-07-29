import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';

const LargeButton = ({ children, className = '', ...rest }) => {
    return (
        <Button className={`pm-button--large ${className}`} {...rest}>
            {children}
        </Button>
    );
};

LargeButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default LargeButton;

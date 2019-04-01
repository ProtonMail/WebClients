import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';

const SmallButton = ({ children, className, ...rest }) => {
    return (
        <Button className={`pm-button--small ${className}`} {...rest}>
            {children}
        </Button>
    );
};

SmallButton.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

SmallButton.defaultProps = {
    className: ''
};

export default SmallButton;

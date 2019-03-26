import React from 'react';
import PropTypes from 'prop-types';

import Button from './Button';

const LinkButton = ({ children, className, ...rest }) => {
    return (
        <Button className={`pm-button--link ${className}`} {...rest}>
            {children}
        </Button>
    );
};

LinkButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

LinkButton.defaultProps = {
    className: ''
};

export default LinkButton;

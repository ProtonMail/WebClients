import React from 'react';
import PropTypes from 'prop-types';

const DropdownButton = ({ className, children, ...rest }) => {
    return (
        <button className={`w100 pt0-5 pb0-5 ${className}`} {...rest}>
            {children}
        </button>
    );
};

DropdownButton.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

DropdownButton.defaultProps = {
    className: ''
};

export default DropdownButton;

import React from 'react';
import PropTypes from 'prop-types';

const DropdownMenuButton = ({ className = '', children, ...rest }) => {
    return (
        <button type="button" className={`w100 pt0-5 pb0-5 ${className}`} {...rest}>
            {children}
        </button>
    );
};

DropdownMenuButton.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

export default DropdownMenuButton;

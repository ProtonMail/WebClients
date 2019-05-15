import React from 'react';
import PropTypes from 'prop-types';

const DropdownLink = ({ className, children, ...rest }) => {
    return (
        <a className={`w100 pt0-5 pb0-5 inbl nodecoration ${className}`} {...rest}>
            {children}
        </a>
    );
};

DropdownLink.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired
};

DropdownLink.defaultProps = {
    className: ''
};

export default DropdownLink;

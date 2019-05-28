import React from 'react';
import PropTypes from 'prop-types';

const InlineLinkButton = ({ children, className, ...rest }) => {
    return (
        <button type="button" role="button" className={`link alignbaseline ${className}`} {...rest}>
            {children}
        </button>
    );
};

InlineLinkButton.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

InlineLinkButton.defaultProps = {
    className: ''
};

export default InlineLinkButton;

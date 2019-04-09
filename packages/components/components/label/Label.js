import React from 'react';
import PropTypes from 'prop-types';

const Label = ({ htmlFor, className, children, ...rest }) => {
    return (
        <label htmlFor={htmlFor} className={`pm-label ${className}`} {...rest}>
            {children}
        </label>
    );
};

Label.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node.isRequired,
    htmlFor: PropTypes.string
};

Label.defaultProps = {
    className: ''
};

export default Label;

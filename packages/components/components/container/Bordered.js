import React from 'react';
import PropTypes from 'prop-types';

const Bordered = ({ children, className, ...rest }) => {
    return (
        <div className={`bordered-container p1 mb1 ${className}`} {...rest}>
            {children}
        </div>
    );
};

Bordered.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

Bordered.defaultProps = {
    className: ''
};

export default Bordered;

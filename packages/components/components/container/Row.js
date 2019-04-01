import React from 'react';
import PropTypes from 'prop-types';

const Row = ({ children, className, ...rest }) => {
    return (
        <div className={`flex flex-nowrap onmobile-flex-column mb1 ${className}`} {...rest}>
            {children}
        </div>
    );
};

Row.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

Row.defaultProps = {
    className: ''
};

export default Row;

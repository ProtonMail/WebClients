import React from 'react';
import PropTypes from 'prop-types';

const Block = ({ children, className = '' }) => {
    return <div className={`mb1 ${className}`}>{children}</div>;
};

Block.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

export default Block;

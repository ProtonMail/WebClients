import React from 'react';
import PropTypes from 'prop-types';

const Text = ({ children, className }) => <span className={`pm-label ${className}`}>{children}</span>;

Text.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string
};

export default Text;
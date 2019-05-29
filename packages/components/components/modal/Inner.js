import React from 'react';
import PropTypes from 'prop-types';

const Inner = ({ children, className }) => <div className={'pm-modalContentInner '.concat(className)}>{children}</div>;

Inner.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string
};

Inner.defaultProps = {
    className: ''
};

export default Inner;

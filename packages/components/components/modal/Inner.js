import React from 'react';
import PropTypes from 'prop-types';

const Inner = ({ children }) => <div className="pm-modalContentInner">{children}</div>;

Inner.propTypes = {
    children: PropTypes.node
};

export default Inner;

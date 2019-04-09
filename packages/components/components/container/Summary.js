import React from 'react';
import PropTypes from 'prop-types';

const Summary = ({ children, ...rest }) => <summary {...rest}>{children}</summary>;

Summary.propTypes = {
    children: PropTypes.node.isRequired
};

export default Summary;

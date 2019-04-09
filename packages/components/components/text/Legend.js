import React from 'react';
import PropTypes from 'prop-types';

const Legend = ({ children, ...rest }) => <legend {...rest}>{children}</legend>;

Legend.propTypes = {
    children: PropTypes.node.isRequired
};

export default Legend;

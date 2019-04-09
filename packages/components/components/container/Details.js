import React from 'react';
import PropTypes from 'prop-types';

const Details = ({ children, open }) => <details open={open}>{children}</details>;

Details.propTypes = {
    children: PropTypes.node.isRequired,
    open: PropTypes.bool
};

export default Details;

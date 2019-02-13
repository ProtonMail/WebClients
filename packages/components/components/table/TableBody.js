import React from 'react';
import PropTypes from 'prop-types';

const TableBody = ({ children, ...rest }) => {
    return <tbody {...rest}>{children}</tbody>;
};

TableBody.propTypes = {
    children: PropTypes.node.isRequired
};

export default TableBody;
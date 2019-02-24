import React from 'react';
import PropTypes from 'prop-types';

import TableRowBusy from '.TableRowBusy';

const TableBody = ({ children, loading, ...rest }) => {
    return <tbody {...rest}>{loading ? <TableRowBusy /> : children}</tbody>;
};

TableBody.propTypes = {
    children: PropTypes.node.isRequired,
    loading: PropTypes.bool
};

TableBody.defaultProps = {
    loading: false
};

export default TableBody;
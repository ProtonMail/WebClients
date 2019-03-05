import React from 'react';
import PropTypes from 'prop-types';

import TableRowBusy from './TableRowBusy';

const TableBody = ({ children, loading, colSpan, ...rest }) => {
    return <tbody {...rest}>{loading ? <TableRowBusy colSpan={colSpan} /> : children}</tbody>;
};

TableBody.propTypes = {
    children: PropTypes.node.isRequired,
    loading: PropTypes.bool,
    colSpan: PropTypes.number
};

TableBody.defaultProps = {
    loading: false
};

export default TableBody;

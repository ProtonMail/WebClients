import React from 'react';
import PropTypes from 'prop-types';

import TableRowBusy from './TableRowBusy';

const TableBody = ({ children, loading = false, colSpan, ...rest }) => {
    return <tbody {...rest}>{loading ? <TableRowBusy colSpan={colSpan} /> : children}</tbody>;
};

TableBody.propTypes = {
    children: PropTypes.node,
    loading: PropTypes.bool,
    colSpan: PropTypes.number
};

export default TableBody;

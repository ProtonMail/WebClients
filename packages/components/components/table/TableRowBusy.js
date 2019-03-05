import React from 'react';
import PropTypes from 'prop-types';

const TableRowBusy = ({ colSpan }) => (
    <tr aria-busy="true">
        <td colSpan={colSpan} />
    </tr>
);

TableRowBusy.propTypes = {
    colSpan: PropTypes.number.isRequired
};

export default TableRowBusy;

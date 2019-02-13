import React from 'react';
import PropTypes from 'prop-types';

import TableCell from './TableCell';

const TableRow = ({ cells, ...rest }) => {
    return (
        <tr {...rest}>
            {cells.map((cell, index) => <TableCell key={index.toString()}>{cell}</TableCell>)}
        </tr>
    );
};

TableRow.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node)
};

TableRow.defaultProps = {
    cells: []
};

export default TableRow;
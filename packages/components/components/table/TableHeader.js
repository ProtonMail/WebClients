import React from 'react';
import PropTypes from 'prop-types';

import TableCell from './TableCell';

const TableHeader = ({ cells, ...rest }) => {
    return (
        <thead {...rest}>
            <tr>
                {cells.map((cell, index) => (
                    <TableCell key={index.toString()} type="header">
                        {cell}
                    </TableCell>
                ))}
            </tr>
        </thead>
    );
};

TableHeader.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node)
};

TableHeader.defaultProps = {
    cells: []
};

export default TableHeader;

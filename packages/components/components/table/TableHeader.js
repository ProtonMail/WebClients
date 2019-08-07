import React from 'react';
import PropTypes from 'prop-types';

import TableCell from './TableCell';

const TableHeader = ({ cells, children, ...rest }) => {
    return (
        <thead {...rest}>
            {children || (
                <tr>
                    {cells.map((cell, index) => (
                        <TableCell key={index.toString()} type="header">
                            {cell}
                        </TableCell>
                    ))}
                </tr>
            )}
        </thead>
    );
};

TableHeader.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node),
    children: PropTypes.node
};

TableHeader.defaultProps = {
    cells: []
};

export default TableHeader;

import React from 'react';
import PropTypes from 'prop-types';

import TableCell from './TableCell';

const TableFooter = ({ cells, ...rest }) => {
    return (
        <tfoot {...rest}>
            <tr>
                {cells.map((cell, index) => <TableCell key={index.toString()}>{cell}</TableCell>)}
            </tr>
        </tfoot>
    );
};

TableFooter.propTypes = {
    cells: PropTypes.arrayOf(PropTypes.node)
};

TableFooter.defaultProps = {
    cells: []
};

export default TableFooter;
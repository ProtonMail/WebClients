import React from 'react';

import TableCell from './TableCell';

interface Props extends React.HTMLAttributes<HTMLTableRowElement> {
    cells?: React.ReactNode[];
    children?: React.ReactNode;
}

const TableRow = React.forwardRef<HTMLTableRowElement, Props>(({ cells = [], children, ...rest }, ref) => {
    return (
        <tr ref={ref} {...rest}>
            {children || cells.map((cell, index) => <TableCell key={index.toString()}>{cell}</TableCell>)}
        </tr>
    );
});

export default TableRow;

TableRow.displayName = 'TableRow';

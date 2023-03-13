import { HTMLAttributes, ReactNode, forwardRef } from 'react';

import TableCell from './TableCell';

interface Props extends HTMLAttributes<HTMLTableRowElement> {
    labels?: ReactNode[];
    cells?: ReactNode[];
    children?: ReactNode;
}

const TableRow = forwardRef<HTMLTableRowElement, Props>(({ labels = [], cells = [], children, ...rest }, ref) => {
    return (
        <tr ref={ref} {...rest} role="row">
            {children ||
                cells.map((cell, index) => (
                    <TableCell key={index.toString()} label={labels[index]}>
                        {cell}
                    </TableCell>
                ))}
        </tr>
    );
});

export default TableRow;

TableRow.displayName = 'TableRow';

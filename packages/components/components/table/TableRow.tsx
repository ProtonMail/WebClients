import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import TableCell from './TableCell';

interface Props extends HTMLAttributes<HTMLTableRowElement> {
    cells?: ReactNode[];
    children?: ReactNode;
}

const TableRow = forwardRef<HTMLTableRowElement, Props>(({ cells = [], children, ...rest }, ref) => {
    return (
        <tr ref={ref} {...rest}>
            {children || cells.map((cell, index) => <TableCell key={index.toString()}>{cell}</TableCell>)}
        </tr>
    );
});

export default TableRow;

TableRow.displayName = 'TableRow';

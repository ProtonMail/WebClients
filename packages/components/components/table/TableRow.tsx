import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import { Cell } from './Cell';
import TableCell from './TableCell';

import './TableRow.scss';

interface Props extends HTMLAttributes<HTMLTableRowElement> {
    labels?: ReactNode[];
    cells?: (Cell | ReactNode)[];
    children?: ReactNode;
}

const TableRow = forwardRef<HTMLTableRowElement, Props>(({ labels = [], cells = [], children, ...rest }, ref) => {
    return (
        <tr ref={ref} {...rest} role="row">
            {children ||
                cells.map((cell, index) => (
                    <TableCell
                        key={
                            /* eslint-disable-next-line react/no-array-index-key */
                            index.toString()
                        }
                        label={labels[index]}
                        colSpan={cell instanceof Cell ? cell.colSpan : undefined}
                        rowSpan={cell instanceof Cell ? cell.rowSpan : undefined}
                    >
                        {cell instanceof Cell ? cell.content : cell}
                    </TableCell>
                ))}
        </tr>
    );
});

export default TableRow;

TableRow.displayName = 'TableRow';

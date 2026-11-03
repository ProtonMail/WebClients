import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import clsx from '@proton/utils/clsx';

import { Cell } from './Cell';
import TableCell from './TableCell';

import './TableRow.scss';

interface Props extends HTMLAttributes<HTMLTableRowElement> {
    labels?: ReactNode[];
    cells?: (Cell | ReactNode)[];
    children?: ReactNode;
    dragging?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, Props>(
    ({ labels = [], cells = [], className, children, dragging, ...rest }, ref) => {
        return (
            // eslint-disable-next-line jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role -- responsive styles set `display: block`, which drops the implicit table semantics
            <tr ref={ref} {...rest} className={clsx(className, dragging && 'table-row--dragging')} role="row">
                {children ||
                    cells.map((cell, index) => (
                        <TableCell
                            // eslint-disable-next-line react/no-array-index-key
                            key={index.toString()}
                            label={labels[index]}
                            colSpan={cell instanceof Cell ? cell.colSpan : undefined}
                            rowSpan={cell instanceof Cell ? cell.rowSpan : undefined}
                        >
                            {cell instanceof Cell ? cell.content : cell}
                        </TableCell>
                    ))}
            </tr>
        );
    }
);

export default TableRow;

TableRow.displayName = 'TableRow';

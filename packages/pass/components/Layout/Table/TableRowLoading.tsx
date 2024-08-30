import type { FC } from 'react';

import { TableCell, TableRow } from '@proton/components';

type Props = { rows: number; cells: number };

export const TableRowLoading: FC<Props> = ({ rows, cells }) =>
    Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`table-row-loading-${i}`}>
            {Array.from({ length: cells }).map((_, j) => (
                <TableCell key={`table-cell-loading-${j}`}>
                    <div className="w-full pass-skeleton pass-skeleton--table-cell " />
                </TableCell>
            ))}
        </TableRow>
    ));

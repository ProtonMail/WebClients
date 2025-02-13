import type { FC } from 'react';

import { SkeletonLoader, TableCell, TableRow } from '@proton/components';

type Props = { rows: number; cells: number };

export const TableRowLoading: FC<Props> = ({ rows, cells }) =>
    Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`table-row-loading-${i}`}>
            {Array.from({ length: cells }).map((_, j) => (
                <TableCell key={`table-cell-loading-${j}`}>
                    <SkeletonLoader width="65%" />
                </TableCell>
            ))}
        </TableRow>
    ));

import type { CSSProperties, ReactNode } from 'react';

import { TableCell } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { CellDefinition } from './types';

interface DriveExplorerCellProps {
    itemId: string;
    cell: CellDefinition;
    style?: React.CSSProperties;
    onClick?: (event: React.MouseEvent) => void;
}

export const DriveExplorerCell = ({ itemId, cell, style, onClick }: DriveExplorerCellProps): ReactNode => {
    const cellStyle: CSSProperties = {
        ...style,
        ...(cell.width && {
            '--w-custom': cell.width,
        }),
        ...cell.cellProps?.style,
    };

    const cellClassName = clsx(
        'm-0 flex items-center',
        cell.className,
        cell.width && 'w-custom',
        cell.cellProps?.className
    );

    return (
        <TableCell
            {...cell.cellProps}
            className={cellClassName}
            style={cellStyle}
            data-cell-id={cell.id}
            data-testid={cell.testId}
            onClick={onClick}
        >
            {cell.render(itemId)}
        </TableCell>
    );
};

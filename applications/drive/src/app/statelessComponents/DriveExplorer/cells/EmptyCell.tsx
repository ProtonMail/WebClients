import { TableCell } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { CellDefinition } from '../types';

export interface EmptyCellProps {
    className?: string;
    style?: React.CSSProperties;
}

export const EmptyCell = ({ className, style }: EmptyCellProps) => {
    return (
        <TableCell className={clsx('m-0', className)} style={style}>
            <div />
        </TableCell>
    );
};

export const EmptyCellConfig: Omit<CellDefinition, 'render'> = {
    id: 'empty',
    width: '3rem',
};

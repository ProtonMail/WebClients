import { TableCell } from '@proton/components';
import clsx from '@proton/utils/clsx';

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

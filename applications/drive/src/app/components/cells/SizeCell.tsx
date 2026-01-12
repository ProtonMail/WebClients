import TableCell from '@proton/components/components/table/TableCell';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { shortHumanSize } from '@proton/shared/lib/helpers/humanSize';
import clsx from '@proton/utils/clsx';

interface SizeCellProps {
    size: number;
}

export const SizeCell = ({ size }: SizeCellProps) => {
    const { viewportWidth } = useActiveBreakpoint();
    const readableSize = shortHumanSize(size);
    return (
        <TableCell
            className={clsx(['flex items-center m-0', viewportWidth['>=large'] ? 'w-1/10' : 'w-1/6'])}
            data-testid="column-size"
        >
            <div className="flex items-center" title={readableSize}>
                <span className="text-ellipsis text-pre">{readableSize}</span>
            </div>
        </TableCell>
    );
};

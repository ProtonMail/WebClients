import { TableCell } from '@proton/components';

import { formatAccessCount } from '../../utils/formatters';

interface AccessCountCellProps {
    numberOfInitializedDownloads: number;
}

// TODO: See if we can combine this cell with others as it's quite simple
export const AccessCountCell = ({ numberOfInitializedDownloads }: AccessCountCellProps) => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="column-num-accesses">
            {formatAccessCount(numberOfInitializedDownloads)}
        </TableCell>
    );
};

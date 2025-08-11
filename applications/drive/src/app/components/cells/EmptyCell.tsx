import { TableCell } from '@proton/components';

export const EmptyCell = () => {
    return (
        <TableCell className="flex items-center m-0 w-1/6" data-testid="empty-cell">
            {null}
        </TableCell>
    );
};

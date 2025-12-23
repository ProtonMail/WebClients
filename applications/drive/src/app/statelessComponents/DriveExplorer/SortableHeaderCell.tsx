import { TableHeaderCell } from '@proton/components';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { SortField } from '../../hooks/util/useSorting';
import { HeaderCellContent } from './HeaderCellContent';
import type { CellDefinition } from './types';

interface SortableHeaderCellProps {
    cell: CellDefinition;
    currentSortField?: SortField;
    currentSortDirection?: SORT_DIRECTION;
    onSort?: () => void;
    loading: boolean;
}

export function SortableHeaderCell({
    cell,
    currentSortField,
    currentSortDirection,
    onSort,
    loading,
}: SortableHeaderCellProps) {
    const isCurrentSort = currentSortField === cell.sortField;
    const isSortable = Boolean(cell.sortField);

    return (
        <TableHeaderCell
            key={cell.id}
            className={clsx('flex items-center m-0', cell.className, cell.headerClassName, cell.width && 'w-custom')}
            style={{
                ...(cell.width && {
                    '--w-custom': cell.width,
                }),
            }}
            direction={isCurrentSort ? currentSortDirection : undefined}
            onSort={isSortable ? onSort : undefined}
            isLoading={loading}
        >
            <HeaderCellContent
                headerText={cell.headerText}
                currentSortField={currentSortField}
                cellSortField={cell.sortField}
            />
        </TableHeaderCell>
    );
}

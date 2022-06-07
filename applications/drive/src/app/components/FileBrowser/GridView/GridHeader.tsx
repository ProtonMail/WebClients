import * as React from 'react';

import { TableRowSticky, TableHeaderCell, Checkbox } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortParams } from '../interface';
import { stopPropagation } from '../../../utils/stopPropagation';
import SortDropdown from '../../sections/SortDropdown';
import { useSelection } from '../state/useSelection';

interface Props<T> {
    activeSortingText: string;
    isLoading?: boolean;
    itemCount: number;
    onSort?: (sortParams: SortParams<T>) => void;
    onToggleAllSelected: () => void;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    sortField: SortParams<T>['sortField'];
    sortFields?: T[];
    sortOrder: SortParams<T>['sortOrder'];
}

export const GridHeader = <T extends string>({
    isLoading,
    sortFields,
    onSort,
    onToggleAllSelected,
    itemCount,
    scrollAreaRef,
    activeSortingText,

    sortField,
    sortOrder,
}: Props<T>) => {
    const selection = useSelection();
    const selectedItemIds = selection?.selectedItemIds || [];

    const handleSort = (key: T) => {
        if (!sortField || !sortOrder || !onSort) {
            return;
        }

        const direction =
            sortField === key && sortOrder === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

        onSort({ sortField: key as T, sortOrder: direction });
    };

    const getSortDirectionForKey = (key: T) => (sortField === key ? sortOrder : undefined);

    const allSelected = Boolean(itemCount) && itemCount === selectedItemIds.length;

    return (
        <thead onContextMenu={stopPropagation}>
            <TableRowSticky scrollAreaRef={scrollAreaRef}>
                <TableHeaderCell>
                    <div role="presentation" key="select-all" className="flex" onClick={stopPropagation}>
                        <Checkbox
                            className="increase-click-surface"
                            disabled={!itemCount}
                            checked={allSelected}
                            onChange={onToggleAllSelected}
                        />
                    </div>
                </TableHeaderCell>
                <TableHeaderCell
                    className="w10e"
                    onSort={() => handleSort(sortField)}
                    direction={getSortDirectionForKey(sortField)}
                    isLoading={isLoading}
                >
                    {activeSortingText}
                </TableHeaderCell>
                <TableHeaderCell>
                    <SortDropdown sortFields={sortFields} sortField={sortField} onSort={onSort} />
                </TableHeaderCell>
            </TableRowSticky>
        </thead>
    );
};

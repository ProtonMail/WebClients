import * as React from 'react';

import { c } from 'ttag';

import { Checkbox, TableHeaderCell, TableRowSticky } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { stopPropagation } from '../../../utils/stopPropagation';
import SortDropdown from '../../sections/SortDropdown';
import { SortParams } from '../interface';
import { useSelection } from '../state/useSelection';

interface Props<T> {
    isLoading?: boolean;
    itemCount: number;
    onToggleAllSelected: () => void;
    scrollAreaRef: React.RefObject<HTMLDivElement>;

    // sorting
    activeSortingText?: string;
    onSort?: (sortParams: SortParams<T>) => void;
    sortField?: SortParams<T>['sortField'];
    sortFields?: T[];
    sortOrder?: SortParams<T>['sortOrder'];
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
                <TableHeaderCell className="file-browser-header-checkbox-cell">
                    <div role="presentation" key="select-all" className="flex" onClick={stopPropagation}>
                        <Checkbox
                            className="increase-click-surface"
                            disabled={!itemCount}
                            checked={allSelected}
                            onChange={onToggleAllSelected}
                        >
                            {selectedCount ? (
                                <span className="ml1">{c('Info').jt`${selectedCount} selected`}</span>
                            ) : null}
                        </Checkbox>
                    </div>
                </TableHeaderCell>
                {!selectedCount && sortFields?.length && sortField && (
                    <>
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
                    </>
                )}
            </TableRowSticky>
        </thead>
    );
};

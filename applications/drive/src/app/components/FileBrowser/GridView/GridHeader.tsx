import * as React from 'react';

import { c } from 'ttag';

import { Checkbox, Loader, TableHeaderCell, TableRowSticky } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { stopPropagation } from '../../../utils/stopPropagation';
import SortDropdown from '../../sections/SortDropdown';
import { SelectionState } from '../hooks/useSelectionControls';
import { SortParams } from '../interface';
import { useSelection } from '../state/useSelection';

interface Props<T> {
    isLoading?: boolean;
    itemCount: number;
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
    itemCount,
    scrollAreaRef,
    activeSortingText,

    sortField,
    sortOrder,
}: Props<T>) => {
    const selection = useSelection();

    const handleSort = (key: T) => {
        if (!sortField || !sortOrder || !onSort) {
            return;
        }

        const direction =
            sortField === key && sortOrder === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

        onSort({ sortField: key as T, sortOrder: direction });
    };

    const getSortDirectionForKey = (key: T) => (sortField === key ? sortOrder : undefined);

    const selectedCount = selection?.selectedItemIds.length;

    return (
        <thead onContextMenu={stopPropagation}>
            <TableRowSticky scrollAreaRef={scrollAreaRef}>
                <TableHeaderCell className="file-browser-header-checkbox-cell">
                    <div role="presentation" key="select-all" className="flex" onClick={stopPropagation}>
                        <Checkbox
                            indeterminate={selection?.selectionState === SelectionState.SOME}
                            className="increase-click-surface mr0-25"
                            disabled={!itemCount}
                            checked={selection?.selectionState !== SelectionState.NONE}
                            onChange={
                                selection?.selectionState === SelectionState.SOME
                                    ? selection?.clearSelections
                                    : selection?.toggleAllSelected
                            }
                        >
                            {selectedCount ? (
                                <span className="ml1">{c('Info').jt`${selectedCount} selected`}</span>
                            ) : null}
                        </Checkbox>
                        {selection?.selectionState !== SelectionState.NONE && isLoading ? (
                            <Loader className="flex flex-item-noshrink" />
                        ) : null}
                    </div>
                </TableHeaderCell>
                {selection?.selectionState === SelectionState.NONE && sortFields?.length && sortField && (
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
                            <SortDropdown
                                className="file-browser-header-sort-cell"
                                sortFields={sortFields}
                                sortField={sortField}
                                onSort={onSort}
                            />
                        </TableHeaderCell>
                    </>
                )}
            </TableRowSticky>
        </thead>
    );
};

import * as React from 'react';

import { c, msgid } from 'ttag';

import { Checkbox, Icon, Loader, TableHeaderCell, TableRowSticky, Tooltip } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { getNumAccessesTooltipMessage } from '@proton/shared/lib/drive/translations';

import { stopPropagation } from '../../../utils/stopPropagation';
import SortDropdown from '../../sections/SortDropdown';
import { SelectionState } from '../hooks/useSelectionControls';
import type { SortParams } from '../interface';
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
                    <div role="presentation" key="select-all" className="flex pl-2" onClick={stopPropagation}>
                        <Checkbox
                            indeterminate={selection?.selectionState === SelectionState.SOME}
                            className="expand-click-area mr-1"
                            disabled={!itemCount}
                            checked={selection?.selectionState !== SelectionState.NONE}
                            onChange={
                                selection?.selectionState === SelectionState.SOME
                                    ? selection?.clearSelections
                                    : selection?.toggleAllSelected
                            }
                        >
                            {selectedCount ? (
                                <span className="ml-2">
                                    {c('Info').ngettext(
                                        msgid`${selectedCount} selected`,
                                        `${selectedCount} selected`,
                                        selectedCount
                                    )}
                                </span>
                            ) : null}
                        </Checkbox>
                        {selection?.selectionState !== SelectionState.NONE && isLoading ? (
                            <Loader className="flex shrink-0" />
                        ) : null}
                    </div>
                </TableHeaderCell>
                {selection?.selectionState === SelectionState.NONE && sortFields?.length && sortField && (
                    <>
                        <TableHeaderCell
                            className="w-custom"
                            style={{ '--w-custom': '10em' }}
                            onSort={() => handleSort(sortField)}
                            direction={getSortDirectionForKey(sortField)}
                            isLoading={isLoading}
                        >
                            {activeSortingText}
                            {sortField === 'numAccesses' && (
                                <Tooltip className="pl-1" title={getNumAccessesTooltipMessage()}>
                                    <Icon name="info-circle" size={3.5} alt={getNumAccessesTooltipMessage()} />
                                </Tooltip>
                            )}
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

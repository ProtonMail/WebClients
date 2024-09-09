import * as React from 'react';

import { c, msgid } from 'ttag';

import { Checkbox, Icon, Loader, TableHeaderCell, TableRowSticky, Tooltip } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { getNumAccessesTooltipMessage } from '@proton/shared/lib/drive/translations';
import clsx from '@proton/utils/clsx';

import { stopPropagation } from '../../../utils/stopPropagation';
import { SelectionState } from '../hooks/useSelectionControls';
import type { SortParams } from '../interface';
import { useSelection } from '../state/useSelection';

interface Props<T> {
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    sortParams?: SortParams<T>;
    isLoading: boolean;
    items: any[];
    onSort?: (params: SortParams<T>) => void;
    itemCount: number;
    isMultiSelectionDisabled?: boolean;
}

export enum HeaderCellsPresets {
    Checkbox,
    Placeholder,
}

const HeaderCell = <T,>({
    item,
    isLoading,
    sortParams,
    itemCount,
    onSort,
    isMultiSelectionDisabled,
}: {
    item: any;
    isLoading: boolean;
    itemCount: number;
    onSort: (key: T) => void;
    sortParams?: SortParams<T>;
    isMultiSelectionDisabled?: boolean;
}) => {
    const selection = useSelection();
    const selectedCount = selection?.selectedItemIds.length;
    if (item.type === HeaderCellsPresets.Checkbox && selection) {
        return (
            <TableHeaderCell className="file-browser-header-checkbox-cell">
                <div role="presentation" key="select-all" className="flex pl-2" onClick={stopPropagation}>
                    <Checkbox
                        indeterminate={selection.selectionState === SelectionState.SOME}
                        className="expand-click-area mr-1"
                        disabled={!itemCount}
                        checked={selection?.selectionState !== SelectionState.NONE}
                        onChange={
                            selection?.selectionState === SelectionState.SOME
                                ? selection.clearSelections
                                : selection.toggleAllSelected
                        }
                        data-testid="checkbox-select-all"
                    >
                        {selectedCount && selection?.selectionState !== SelectionState.NONE ? (
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
        );
    }

    if (!isMultiSelectionDisabled && selection?.selectionState !== SelectionState.NONE) {
        return null;
    }

    if (item.type === HeaderCellsPresets.Placeholder) {
        return (
            <TableHeaderCell
                className={clsx(['file-browser-list--icon-column', item.props?.className])}
                style={item.props.style}
            />
        );
    }

    const getSortDirectionForKey = (key: T) => (sortParams?.sortField === key ? sortParams.sortOrder : undefined);

    return (
        <TableHeaderCell
            className={item.props?.className}
            direction={getSortDirectionForKey(item.type)}
            onSort={item.sorting ? () => onSort?.(item.type) : undefined}
            isLoading={isLoading && sortParams?.sortField === item.type}
            data-testid="sort-by"
        >
            {item.getText()}
            {item.type === 'numAccesses' && (
                <Tooltip className="pl-1" title={getNumAccessesTooltipMessage()}>
                    <Icon name="info-circle" size={3.5} alt={getNumAccessesTooltipMessage()} />
                </Tooltip>
            )}
        </TableHeaderCell>
    );
};

const ListHeader = <T,>({
    scrollAreaRef,
    items,
    sortParams,
    isLoading,
    itemCount,
    onSort,
    isMultiSelectionDisabled,
}: Props<T>) => {
    const handleSort = (key: T) => {
        if (!sortParams || !onSort) {
            return;
        }

        const direction =
            sortParams.sortField === key && sortParams.sortOrder === SORT_DIRECTION.ASC
                ? SORT_DIRECTION.DESC
                : SORT_DIRECTION.ASC;

        onSort({ sortField: key, sortOrder: direction });
    };

    return (
        <thead onContextMenu={(e) => e.stopPropagation()}>
            <TableRowSticky scrollAreaRef={scrollAreaRef}>
                {items.map((item, index) => (
                    <HeaderCell
                        item={item}
                        isLoading={isLoading}
                        sortParams={sortParams}
                        key={index}
                        itemCount={itemCount}
                        onSort={handleSort}
                        isMultiSelectionDisabled={isMultiSelectionDisabled}
                    />
                ))}
            </TableRowSticky>
        </thead>
    );
};

export default ListHeader;

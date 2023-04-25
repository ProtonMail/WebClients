import * as React from 'react';

import { c } from 'ttag';

import { Checkbox, Loader, TableHeaderCell, TableRowSticky } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { stopPropagation } from '../../../utils/stopPropagation';
import { SelectionState } from '../hooks/useSelectionControls';
import { SortParams } from '../interface';
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
                <div role="presentation" key="select-all" className="flex" onClick={stopPropagation}>
                    <Checkbox
                        indeterminate={selection.selectionState === SelectionState.SOME}
                        className="increase-click-surface mr-1"
                        disabled={!itemCount}
                        checked={selection?.selectionState !== SelectionState.NONE}
                        onChange={
                            selection?.selectionState === SelectionState.SOME
                                ? selection.clearSelections
                                : selection.toggleAllSelected
                        }
                    >
                        {selection?.selectionState !== SelectionState.NONE ? (
                            <span className="ml-4">{c('Info').jt`${selectedCount} selected`}</span>
                        ) : null}
                    </Checkbox>
                    {selection?.selectionState !== SelectionState.NONE && isLoading ? (
                        <Loader className="flex flex-item-noshrink" />
                    ) : null}
                </div>
            </TableHeaderCell>
        );
    }

    if (!isMultiSelectionDisabled && selection?.selectionState !== SelectionState.NONE) {
        return null;
    }

    if (item.type === HeaderCellsPresets.Placeholder) {
        return <TableHeaderCell className={clsx(['file-browser-list--icon-column', item.props?.className])} />;
    }

    const getSortDirectionForKey = (key: T) => (sortParams?.sortField === key ? sortParams.sortOrder : undefined);

    return (
        <TableHeaderCell
            className={item.props?.className}
            direction={getSortDirectionForKey(item.type)}
            onSort={item.sorting ? () => onSort?.(item.type) : undefined}
            isLoading={isLoading && sortParams?.sortField === item.type}
        >
            {item.getText()}
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

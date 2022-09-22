import * as React from 'react';

import { Checkbox, TableHeaderCell, TableRowSticky } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { stopPropagation } from '../../../utils/stopPropagation';
import { SortParams } from '../interface';
import { useSelection } from '../state/useSelection';

interface Props<T> {
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    sortParams?: SortParams<T>;
    isLoading: boolean;
    items: any[];
    onSort?: (params: SortParams<T>) => void;
    itemCount: number;
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
}: {
    item: any;
    isLoading: boolean;
    itemCount: number;
    onSort: (key: T) => void;
    sortParams?: SortParams<T>;
}) => {
    const selectionControls = useSelection();
    if (item.type === HeaderCellsPresets.Checkbox && selectionControls) {
        const allSelected = Boolean(itemCount && itemCount === selectionControls.selectedItemIds.length);

        return (
            <TableHeaderCell>
                <div role="presentation" key="select-all" className="flex" onClick={stopPropagation}>
                    <Checkbox
                        className="increase-click-surface"
                        disabled={!itemCount}
                        checked={allSelected}
                        onChange={selectionControls.toggleAllSelected}
                    />
                </div>
            </TableHeaderCell>
        );
    }

    if (item.type === HeaderCellsPresets.Placeholder) {
        return <TableHeaderCell className="file-browser-list--icon-column" />;
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

const ListHeader = <T,>({ scrollAreaRef, items, sortParams, isLoading, itemCount, onSort }: Props<T>) => {
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
                    />
                ))}
            </TableRowSticky>
        </thead>
    );
};

export default ListHeader;

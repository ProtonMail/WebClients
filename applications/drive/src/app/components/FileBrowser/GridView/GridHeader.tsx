import * as React from 'react';

import { TableRowSticky, TableHeaderCell, Checkbox } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { AllSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { translateSortField } from '../../sections/SortDropdown';

interface Props<T extends AllSortKeys> {
    sortParams?: SortParams<T>;
    setSorting?: (sortParams: SortParams<T>) => void;
    selectedItems: FileBrowserItem[];
    onToggleAllSelected: () => void;
    contents: FileBrowserItem[];
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    SortDropdown?: React.FunctionComponent;
}

const GridHeader = <T extends AllSortKeys>({
    setSorting,
    sortParams,
    contents,
    selectedItems,
    onToggleAllSelected,
    scrollAreaRef,
    SortDropdown,
}: Props<T>) => {
    const canSort = (fn?: () => void) => (setSorting ? fn : undefined);

    const handleSort = (key: AllSortKeys) => {
        if (!sortParams || !setSorting) {
            return;
        }

        const direction =
            sortParams.sortField === key && sortParams.sortOrder === SORT_DIRECTION.ASC
                ? SORT_DIRECTION.DESC
                : SORT_DIRECTION.ASC;

        setSorting({ sortField: key as T, sortOrder: direction });
    };

    const getSortDirectionForKey = (key: AllSortKeys) =>
        sortParams?.sortField === key ? sortParams.sortOrder : undefined;

    const allSelected = !!contents.length && contents.length === selectedItems.length;

    if (!SortDropdown || !sortParams || !setSorting) {
        return <></>;
    }

    return (
        <thead onContextMenu={(e) => e.stopPropagation()}>
            <TableRowSticky scrollAreaRef={scrollAreaRef}>
                <TableHeaderCell>
                    <div role="presentation" key="select-all" className="flex" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            className="increase-click-surface"
                            disabled={!contents.length}
                            checked={allSelected}
                            onChange={onToggleAllSelected}
                        />
                    </div>
                </TableHeaderCell>
                <TableHeaderCell
                    className="w10e"
                    onSort={canSort(() => handleSort(sortParams.sortField))}
                    direction={getSortDirectionForKey(sortParams.sortField)}
                >
                    {translateSortField(sortParams.sortField)}
                </TableHeaderCell>
                <TableHeaderCell>
                    <SortDropdown />
                </TableHeaderCell>
            </TableRowSticky>
        </thead>
    );
};

export default GridHeader;

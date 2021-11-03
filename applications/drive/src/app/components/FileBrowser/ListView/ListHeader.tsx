import * as React from 'react';

import { TableRowSticky, TableHeaderCell, Checkbox, useActiveBreakpoint } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { AllSortKeys, SortParams } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem, FileBrowserLayouts } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useFileBrowserColumns } from '../useFileBrowserColumns';

interface Props<T extends AllSortKeys> {
    type: FileBrowserLayouts;
    sortParams?: SortParams<T>;
    setSorting?: (sortParams: SortParams<T>) => void;
    selectedItems: FileBrowserItem[];
    onToggleAllSelected: () => void;
    contents: FileBrowserItem[];
    scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const ListHeader = <T extends AllSortKeys>({
    type,
    setSorting,
    sortParams,
    contents,
    selectedItems,
    onToggleAllSelected,
    scrollAreaRef,
}: Props<T>) => {
    const { isDesktop } = useActiveBreakpoint();
    const columns = useFileBrowserColumns(type);

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
                <TableHeaderCell onSort={canSort(() => handleSort('Name'))} direction={getSortDirectionForKey('Name')}>
                    {c('TableHeader').t`Name`}
                </TableHeaderCell>
                {columns.includes('location') && (
                    <TableHeaderCell className={isDesktop ? 'w20' : 'w25'}>{c('TableHeader')
                        .t`Location`}</TableHeaderCell>
                )}
                {columns.includes('uploaded') && (
                    // On API its called ModifyTime, but its actually time when
                    // the last revision was uploaded. The real modify time is
                    // stored in encrypted extended attributes.
                    <TableHeaderCell
                        className="w15"
                        direction={getSortDirectionForKey('ModifyTime')}
                        onSort={canSort(() => handleSort('ModifyTime'))}
                    >
                        {c('TableHeader').t`Uploaded`}
                    </TableHeaderCell>
                )}
                {columns.includes('modified') && (
                    <TableHeaderCell className="w15">{c('TableHeader').t`Modified`}</TableHeaderCell>
                )}
                {columns.includes('trashed') && (
                    <TableHeaderCell
                        className="w25"
                        direction={getSortDirectionForKey('ModifyTime')}
                        onSort={canSort(() => handleSort('ModifyTime'))}
                    >
                        {c('TableHeader').t`Deleted`}
                    </TableHeaderCell>
                )}
                {columns.includes('size') && (
                    <TableHeaderCell
                        direction={getSortDirectionForKey('Size')}
                        onSort={canSort(() => handleSort('Size'))}
                        className={isDesktop ? 'w10' : 'w15'}
                    >
                        {c('TableHeader').t`Size`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_created') && (
                    <TableHeaderCell
                        className="w15"
                        direction={getSortDirectionForKey('CreateTime')}
                        onSort={canSort(() => handleSort('CreateTime'))}
                    >
                        {c('TableHeader').t`Created`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_num_access') && (
                    <TableHeaderCell className="w15">{c('TableHeader').t`# of accesses`}</TableHeaderCell>
                )}
                {columns.includes('share_expires') && (
                    <TableHeaderCell
                        className="w20"
                        direction={getSortDirectionForKey('ExpireTime')}
                        onSort={canSort(() => handleSort('ExpireTime'))}
                    >
                        {c('TableHeader').t`Expires`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_options') && (
                    <TableHeaderCell className="file-browser-list--share-column" />
                )}
            </TableRowSticky>
        </thead>
    );
};

export default ListHeader;

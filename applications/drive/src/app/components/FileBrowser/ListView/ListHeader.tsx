import * as React from 'react';

import { TableRowSticky, TableHeaderCell, Checkbox, useActiveBreakpoint } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import {
    FileBrowserItem,
    FileBrowserLayouts,
    SortParams,
    SortField,
} from '@proton/shared/lib/interfaces/drive/fileBrowser';

import { useFileBrowserColumns } from '../useFileBrowserColumns';

interface Props<T extends SortField> {
    type: FileBrowserLayouts;
    isLoading?: boolean;
    sortParams?: SortParams<T>;
    setSorting?: (sortParams: SortParams<T>) => void;
    selectedItems: FileBrowserItem[];
    onToggleAllSelected: () => void;
    contents: FileBrowserItem[];
    scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const ListHeader = <T extends SortField>({
    type,
    isLoading,
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

    const handleSort = (key: SortField) => {
        if (!sortParams || !setSorting) {
            return;
        }

        const direction =
            sortParams.sortField === key && sortParams.sortOrder === SORT_DIRECTION.ASC
                ? SORT_DIRECTION.DESC
                : SORT_DIRECTION.ASC;

        setSorting({ sortField: key as T, sortOrder: direction });
    };

    const getSortDirectionForKey = (key: SortField) =>
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
                <TableHeaderCell
                    onSort={canSort(() => handleSort('name'))}
                    direction={getSortDirectionForKey('name')}
                    isLoading={isLoading && sortParams?.sortField === 'name'}
                >
                    {c('TableHeader').t`Name`}
                </TableHeaderCell>
                {(columns.includes('location') || columns.includes('original_location')) && (
                    <TableHeaderCell className={isDesktop ? 'w20' : 'w25'}>{c('TableHeader')
                        .t`Location`}</TableHeaderCell>
                )}
                {columns.includes('uploaded') && (
                    <TableHeaderCell className="w15">{c('TableHeader').t`Uploaded`}</TableHeaderCell>
                )}
                {columns.includes('modified') && (
                    <TableHeaderCell
                        className="w15"
                        direction={getSortDirectionForKey('fileModifyTime')}
                        onSort={canSort(() => handleSort('fileModifyTime'))}
                        isLoading={isLoading && sortParams?.sortField === 'fileModifyTime'}
                    >
                        {c('TableHeader').t`Modified`}
                    </TableHeaderCell>
                )}
                {columns.includes('trashed') && (
                    <TableHeaderCell
                        className="w25"
                        direction={getSortDirectionForKey('trashed')}
                        onSort={canSort(() => handleSort('trashed'))}
                        isLoading={isLoading && sortParams?.sortField === 'trashed'}
                    >
                        {c('TableHeader').t`Deleted`}
                    </TableHeaderCell>
                )}
                {columns.includes('size') && (
                    <TableHeaderCell
                        direction={getSortDirectionForKey('size')}
                        onSort={canSort(() => handleSort('size'))}
                        className={isDesktop ? 'w10' : 'w15'}
                        isLoading={isLoading && sortParams?.sortField === 'size'}
                    >
                        {c('TableHeader').t`Size`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_created') && (
                    <TableHeaderCell
                        className="w15"
                        direction={getSortDirectionForKey('linkCreateTime')}
                        onSort={canSort(() => handleSort('linkCreateTime'))}
                        isLoading={isLoading && sortParams?.sortField === 'linkCreateTime'}
                    >
                        {c('TableHeader').t`Created`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_num_access') && (
                    <TableHeaderCell
                        className="w15"
                        direction={getSortDirectionForKey('numAccesses')}
                        onSort={canSort(() => handleSort('numAccesses'))}
                        isLoading={isLoading && sortParams?.sortField === 'numAccesses'}
                    >
                        {c('TableHeader').t`# of accesses`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_expires') && (
                    <TableHeaderCell
                        className="w20"
                        direction={getSortDirectionForKey('linkExpireTime')}
                        onSort={canSort(() => handleSort('linkExpireTime'))}
                        isLoading={isLoading && sortParams?.sortField === 'linkExpireTime'}
                    >
                        {c('TableHeader').t`Expires`}
                    </TableHeaderCell>
                )}
                {columns.includes('share_options') && <TableHeaderCell className="file-browser-list--icon-column" />}
                <TableHeaderCell className="file-browser-list--icon-column" />
            </TableRowSticky>
        </thead>
    );
};

export default ListHeader;

import React from 'react';
import { TableRowSticky, TableHeaderCell, Checkbox, useActiveBreakpoint } from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { SortKeys, SortParams } from '../../../interfaces/link';
import { FileBrowserItem, FileBrowserLayouts } from '../interfaces';
import { fileBrowserColumns } from '../constants';

interface Props {
    type: FileBrowserLayouts;
    sortParams?: SortParams;
    setSorting?: (sortField: SortKeys, sortOrder: SORT_DIRECTION) => void;
    selectedItems: FileBrowserItem[];
    onToggleAllSelected: () => void;
    contents: FileBrowserItem[];
    scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const ListHeader = ({
    type,
    setSorting,
    sortParams,
    contents,
    selectedItems,
    onToggleAllSelected,
    scrollAreaRef,
}: Props) => {
    const { isDesktop } = useActiveBreakpoint();
    const canSort = (fn?: () => void) => (type === 'drive' ? fn : undefined);

    const handleSort = (key: SortKeys) => {
        if (!sortParams || !setSorting) {
            return;
        }

        const direction =
            sortParams.sortField === key && sortParams.sortOrder === SORT_DIRECTION.DESC
                ? SORT_DIRECTION.ASC
                : SORT_DIRECTION.DESC;

        setSorting(key, direction);
    };

    const getSortDirectionForKey = (key: SortKeys) =>
        sortParams?.sortField === key ? sortParams.sortOrder : undefined;

    const allSelected = !!contents.length && contents.length === selectedItems.length;
    const columns = fileBrowserColumns[type];

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
                {columns.includes('type') && (
                    <TableHeaderCell
                        direction={getSortDirectionForKey('MIMEType')}
                        onSort={canSort(() => handleSort('MIMEType'))}
                        className="w20"
                    >
                        {c('TableHeader').t`Type`}
                    </TableHeaderCell>
                )}
                {isDesktop && columns.includes('modified') && (
                    <TableHeaderCell
                        className="w25"
                        direction={getSortDirectionForKey('ModifyTime')}
                        onSort={canSort(() => handleSort('ModifyTime'))}
                    >
                        {type === 'drive' ? c('TableHeader').t`Modified` : c('TableHeader').t`Deleted`}
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
                {isDesktop && columns.includes('share_created') && (
                    <TableHeaderCell className="w15">{c('TableHeader').t`Created`}</TableHeaderCell>
                )}
                {isDesktop && columns.includes('share_num_access') && (
                    <TableHeaderCell className="w15">{c('TableHeader').t`# of accesses`}</TableHeaderCell>
                )}
                {columns.includes('share_expires') && (
                    <TableHeaderCell className="w20">{c('TableHeader').t`Expires`}</TableHeaderCell>
                )}
            </TableRowSticky>
        </thead>
    );
};

export default ListHeader;

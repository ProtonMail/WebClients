import React from 'react';
import { TableRowSticky, TableHeaderCell, Checkbox, useActiveBreakpoint } from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { SortKeys, SortParams } from '../../../interfaces/link';
import { FileBrowserItem } from '../interfaces';

interface Props {
    isTrash?: boolean;
    sortParams?: SortParams;
    setSorting?: (sortField: SortKeys, sortOrder: SORT_DIRECTION) => void;
    selectedItems: FileBrowserItem[];
    onToggleAllSelected: () => void;
    contents: FileBrowserItem[];
    scrollAreaRef: React.RefObject<HTMLDivElement>;
}

const ListHeader = ({
    isTrash,
    setSorting,
    sortParams,
    contents,
    selectedItems,
    onToggleAllSelected,
    scrollAreaRef,
}: Props) => {
    const { isDesktop } = useActiveBreakpoint();
    const unlessIsTrash = (fn?: () => void) => (isTrash ? undefined : fn);

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
    const modifiedHeader = isTrash ? c('TableHeader').t`Deleted` : c('TableHeader').t`Modified`;

    return (
        <thead onContextMenu={(e) => e.stopPropagation()}>
            <TableRowSticky scrollAreaRef={scrollAreaRef}>
                <TableHeaderCell>
                    <div role="presentation" key="select-all" className="flex" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                            className="increase-surface-click"
                            disabled={!contents.length}
                            checked={allSelected}
                            onChange={onToggleAllSelected}
                        />
                    </div>
                </TableHeaderCell>
                <TableHeaderCell>
                    <div className="ellipsis">{c('TableHeader').t`Name`}</div>
                </TableHeaderCell>
                {isTrash && <TableHeaderCell className="w25">{c('TableHeader').t`Location`}</TableHeaderCell>}
                <TableHeaderCell
                    direction={getSortDirectionForKey('MIMEType')}
                    onSort={unlessIsTrash(() => handleSort('MIMEType'))}
                    className={isDesktop ? 'w20' : 'w25'}
                >
                    {c('TableHeader').t`Type`}
                </TableHeaderCell>
                {isDesktop && (
                    <TableHeaderCell
                        direction={getSortDirectionForKey('ModifyTime')}
                        onSort={unlessIsTrash(() => handleSort('ModifyTime'))}
                    >
                        {modifiedHeader}
                    </TableHeaderCell>
                )}
                <TableHeaderCell
                    direction={getSortDirectionForKey('Size')}
                    onSort={unlessIsTrash(() => handleSort('Size'))}
                    className={isDesktop ? 'w10' : 'w15'}
                >
                    {c('TableHeader').t`Size`}
                </TableHeaderCell>
            </TableRowSticky>
        </thead>
    );
};

export default ListHeader;

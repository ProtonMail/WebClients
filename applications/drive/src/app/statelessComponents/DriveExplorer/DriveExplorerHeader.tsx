import { type RefObject, useCallback, useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Checkbox, Table, TableHeader, TableHeaderCell, TableRowSticky } from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';
import clsx from '@proton/utils/clsx';

import { GridHeader } from './GridHeader';
import { SortableHeaderCell } from './SortableHeaderCell';
import type { CellDefinition, DriveExplorerConfig, DriveExplorerSelection, DriveExplorerSort } from './types';

interface DriveExplorerHeaderProps {
    cells: CellDefinition[];
    selection?: DriveExplorerSelection;
    sort?: DriveExplorerSort;
    caption?: string;
    config?: DriveExplorerConfig;
    containerRef: RefObject<HTMLDivElement>;
    itemCount: number;
    layout: LayoutSetting;
    loading: boolean;
    showCheckboxColumn?: boolean;
    showContextMenuButton?: boolean;
}

export const DriveExplorerHeader = ({
    selection,
    sort,
    caption,
    config,
    containerRef,
    cells,
    itemCount,
    layout,
    loading,
    showCheckboxColumn = true,
    showContextMenuButton = true,
}: DriveExplorerHeaderProps) => {
    const selectedCount = selection?.selectedItems.size;

    const headerCheckboxState = useMemo(() => {
        if (!selectedCount || itemCount === 0) {
            return { checked: false, indeterminate: false };
        }

        if (selectedCount === 0) {
            return { checked: false, indeterminate: false };
        } else if (selectedCount === itemCount) {
            return { checked: true, indeterminate: false };
        } else {
            return { checked: false, indeterminate: true };
        }
    }, [selectedCount, itemCount]);

    const handleHeaderCheckboxClick = useCallback(() => {
        if (!selection?.selectionMethods) {
            return;
        }

        const haveSelectedItems = headerCheckboxState.checked || headerCheckboxState.indeterminate;
        if (haveSelectedItems) {
            selection.selectionMethods.clearSelections();
        } else {
            selection.selectionMethods.toggleAllSelected();
        }
    }, [selection, headerCheckboxState.checked, headerCheckboxState.indeterminate]);

    const handleSort = useCallback(
        (cell: CellDefinition) => {
            return () => {
                if (selectedCount && selectedCount > 0) {
                    return;
                }

                if (cell.sortField && cell.sortConfig && sort?.onSort) {
                    const isCurrentSort = sort.sortBy === cell.sortField;
                    const newDirection =
                        isCurrentSort && sort.sortDirection === SORT_DIRECTION.ASC
                            ? SORT_DIRECTION.DESC
                            : SORT_DIRECTION.ASC;
                    sort.onSort({
                        sortField: cell.sortField,
                        sortConfig: cell.sortConfig,
                        direction: newDirection,
                    });
                }
            };
        },
        [selectedCount, sort]
    );

    return (
        <Table
            className={clsx(
                'w-full m-0 h-auto',
                'simple-table--is-hoverable border-none border-collapse',
                config?.tableClassName
            )}
            caption={caption}
            borderWeak
        >
            <TableHeader className={config?.headerClassName}>
                <TableRowSticky
                    className="flex h-custom"
                    scrollAreaRef={containerRef}
                    style={{ '--h-custom': '2.7rem' }}
                >
                    {layout === LayoutSetting.Grid ? (
                        <GridHeader
                            cells={cells}
                            sort={sort}
                            showCheckboxColumn={showCheckboxColumn}
                            selectedCount={selectedCount}
                            headerCheckboxState={headerCheckboxState}
                            onHeaderCheckboxClick={handleHeaderCheckboxClick}
                            loading={loading}
                        />
                    ) : (
                        <>
                            {showCheckboxColumn ? (
                                <TableHeaderCell
                                    className={clsx(
                                        'm-0 flex items-center ',
                                        selectedCount && selectedCount > 0 ? 'w-full' : 'w-custom'
                                    )}
                                    style={{ '--w-custom': '2.75rem' }}
                                >
                                    <Checkbox
                                        className="ml-2 expand-click-area"
                                        checked={headerCheckboxState.checked}
                                        indeterminate={headerCheckboxState.indeterminate}
                                        onChange={handleHeaderCheckboxClick}
                                    >
                                        {selectedCount && selectedCount > 0 ? (
                                            <span className=" ml-2">
                                                {c('Info').ngettext(
                                                    msgid`${selectedCount} selected`,
                                                    `${selectedCount} selected`,
                                                    selectedCount
                                                )}
                                            </span>
                                        ) : (
                                            <span className="ml-2" />
                                        )}
                                    </Checkbox>
                                </TableHeaderCell>
                            ) : (
                                <TableHeaderCell className="m-0 w-0" />
                            )}
                            {!(selectedCount && selectedCount > 0) &&
                                cells.map((cell, index) => {
                                    if (cell.disabled) {
                                        return null;
                                    }
                                    const showLoader = loading && index === 0;
                                    return (
                                        <SortableHeaderCell
                                            key={cell.id}
                                            cell={cell}
                                            currentSortField={sort?.sortBy}
                                            currentSortDirection={sort?.sortDirection}
                                            onSort={handleSort(cell)}
                                            loading={showLoader}
                                        />
                                    );
                                })}
                            {/* Empty space for context menu */}
                            {showContextMenuButton && !(selectedCount && selectedCount > 0) && (
                                <TableHeaderCell
                                    className="m-0 w-custom"
                                    style={{
                                        '--w-custom': '2.75rem',
                                    }}
                                />
                            )}
                        </>
                    )}
                </TableRowSticky>
            </TableHeader>
        </Table>
    );
};

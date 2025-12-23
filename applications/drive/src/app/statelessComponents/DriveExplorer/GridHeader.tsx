import { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Checkbox,
    Dropdown,
    DropdownCaret,
    DropdownMenu,
    DropdownMenuButton,
    TableHeaderCell,
    usePopperAnchor,
} from '@proton/components';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import generateUID from '@proton/utils/generateUID';

import { HeaderCellContent } from './HeaderCellContent';
import type { CellDefinition, DriveExplorerSort } from './types';

interface GridHeaderProps {
    cells: CellDefinition[];
    sort?: DriveExplorerSort;
    showCheckboxColumn: boolean;
    selectedCount?: number;
    headerCheckboxState: { checked: boolean; indeterminate: boolean };
    onHeaderCheckboxClick: () => void;
    loading: boolean;
}

export function GridHeader({
    cells,
    sort,
    showCheckboxColumn,
    selectedCount,
    headerCheckboxState,
    onHeaderCheckboxClick,
    loading,
}: GridHeaderProps) {
    const [uid] = useState(generateUID('dropdown'));
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const sortableCells = cells.filter((cell) => Boolean(cell.sortField));
    const currentSortCell = sortableCells.find((cell) => cell.sortField === sort?.sortBy);

    if (!currentSortCell) {
        return null;
    }

    const isCurrentSort = sort?.sortBy === currentSortCell.sortField;
    const sortDirection = isCurrentSort ? sort?.sortDirection : undefined;
    const isSortable = Boolean(currentSortCell.sortField);

    const handleSort = () => {
        if (isSortable && sort?.onSort && currentSortCell.sortField && currentSortCell.sortConfig) {
            const newDirection =
                isCurrentSort && sortDirection === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
            sort.onSort({
                sortField: currentSortCell.sortField,
                sortConfig: currentSortCell.sortConfig,
                direction: newDirection,
            });
        }
    };

    const hasSelectedItems = selectedCount && selectedCount > 0;
    const showSortControls = !hasSelectedItems || !showCheckboxColumn;

    if (!showCheckboxColumn && sortableCells.length === 0) {
        return null;
    }

    return (
        <>
            {showCheckboxColumn ? (
                <TableHeaderCell
                    className={clsx(
                        'm-0 flex items-center',
                        selectedCount && selectedCount > 0 ? 'w-full' : 'w-custom'
                    )}
                    style={{ '--w-custom': '2.75rem' }}
                >
                    <Checkbox
                        className="ml-2 expand-click-area"
                        checked={headerCheckboxState.checked}
                        indeterminate={headerCheckboxState.indeterminate}
                        onChange={onHeaderCheckboxClick}
                    >
                        {selectedCount && selectedCount > 0 ? (
                            <span className="ml-2">
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
            {showSortControls && (
                <>
                    <TableHeaderCell
                        className="m-0 w-custom flex items-center"
                        style={{ '--w-custom': '10em' }}
                        direction={isCurrentSort ? sortDirection : undefined}
                        onSort={isSortable ? handleSort : undefined}
                        isLoading={loading}
                    >
                        <HeaderCellContent
                            headerText={currentSortCell.headerText}
                            currentSortField={sort?.sortBy}
                            cellSortField={currentSortCell.sortField}
                        />
                    </TableHeaderCell>
                    <TableHeaderCell className="m-0 flex-1 flex items-center">
                        <Button
                            aria-describedby={uid}
                            ref={anchorRef}
                            aria-expanded={isOpen}
                            onClick={toggle}
                            data-testid="toolbar-sort"
                            title={c('Title').t`Sort files/folders`}
                            shape="ghost"
                            size="small"
                            icon
                            // TODO: Find a better way than this hack
                            style={{ margin: '-0.5rem' }}
                        >
                            <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon" size={4} />
                        </Button>
                        <Dropdown
                            id={uid}
                            isOpen={isOpen}
                            anchorRef={anchorRef}
                            onClose={close}
                            originalPlacement="bottom-start"
                            className="dropdown--no-max-size"
                        >
                            <DropdownMenu>
                                {sortableCells.map((cell) => (
                                    <DropdownMenuButton
                                        key={cell.id}
                                        className="flex flex-nowrap text-left"
                                        onClick={() => {
                                            if (sort && cell.sortField && currentSortCell.sortConfig && sort.onSort) {
                                                sort.onSort({
                                                    sortField: cell.sortField,
                                                    sortConfig: currentSortCell.sortConfig,
                                                    direction: SORT_DIRECTION.ASC,
                                                });
                                            }
                                        }}
                                        aria-current={cell.sortField === sort?.sortBy}
                                    >
                                        {cell.headerText}
                                    </DropdownMenuButton>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    </TableHeaderCell>
                </>
            )}
        </>
    );
}

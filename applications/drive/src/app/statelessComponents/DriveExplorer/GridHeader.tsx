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
import generateUID from '@proton/utils/generateUID';

import type { SortField } from '../../hooks/util/useSorting';
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
        if (isSortable && sort?.onSort && currentSortCell.sortField) {
            const newDirection =
                isCurrentSort && sortDirection === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;
            sort.onSort(currentSortCell.sortField as SortField, newDirection);
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
                <TableHeaderCell className="m-0 w-custom" style={{ '--w-custom': '2.5rem' }}>
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
                        ) : null}
                    </Checkbox>
                </TableHeaderCell>
            ) : (
                <TableHeaderCell className="w-0" />
            )}
            {showSortControls && (
                <>
                    <TableHeaderCell
                        className="m-0 w-custom"
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
                    <TableHeaderCell className="m-0">
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
                        >
                            <DropdownCaret isOpen={isOpen} className="expand-caret toolbar-icon my-auto" size={4} />
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
                                        onClick={() =>
                                            sort && cell.sortField && sort.onSort?.(cell.sortField, SORT_DIRECTION.ASC)
                                        }
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

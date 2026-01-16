import { useCallback, useEffect, useRef } from 'react';

import { DragMoveContainer, TableCell, TableRow, useDragMove } from '@proton/components';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { DriveExplorerCell } from './DriveExplorerCell';
import { CheckboxCell } from './cells/CheckboxCell';
import { ContextMenuCellWithControls } from './cells/ContextMenuCell';
import { EmptyCell } from './cells/EmptyCell';
import type {
    CellDefinition,
    ContextMenuControls,
    DragMoveControls,
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
} from './types';
import { useItemInteraction } from './useItemInteraction';

interface DriveExplorerRowProps {
    itemId: string;
    cells: CellDefinition[];
    style: React.CSSProperties;
    conditions?: DriveExplorerConditions;
    selection: DriveExplorerSelection;
    events?: DriveExplorerEvents;
    onObserve?: (element: HTMLElement | null, uid: string) => void;
    dragMoveControls?: DragMoveControls;
    isMultiSelectionDisabled?: boolean;
    className?: string;
    showCheckboxColumn?: boolean;
    contextMenuControls?: ContextMenuControls;
}

export const DriveExplorerRow = ({
    className,
    itemId,
    cells,
    style,
    selection,
    events,
    conditions,
    onObserve,
    dragMoveControls,
    isMultiSelectionDisabled,
    showCheckboxColumn = true,
    contextMenuControls,
}: DriveExplorerRowProps) => {
    const isSelected = selection?.selectedItems.has(itemId) ?? false;
    const rowRef = useRef<HTMLTableRowElement>(null);

    const dragMove = useDragMove({
        dragging: dragMoveControls?.dragging ?? false,
        setDragging: dragMoveControls?.setDragging ?? noop,
        format: CUSTOM_DATA_FORMAT,
        formatter: JSON.stringify,
    });

    const selectedItems = Array.from(selection?.selectedItems || []);
    const isDraggingSelected = isSelected;
    const dragMoveItems = isDraggingSelected ? selectedItems : [itemId];

    const {
        handleMouseDown,
        handleClick,
        handleDoubleClick,
        handleContextMenu,
        handleKeyDown,
        handleDragStart: handleDragStartSelection,
    } = useItemInteraction({
        itemId,
        isSelected,
        selection,
        events,
        conditions,
        isMultiSelectionDisabled,
        dragMoveControls,
    });

    useEffect(() => {
        if (onObserve && rowRef.current) {
            onObserve(rowRef.current, itemId);
        }
    }, [onObserve, itemId]);

    const canBeDropTarget = dragMoveControls?.canDropIntoItem?.(itemId) ?? false;

    const handleDragStart = useCallback(
        (event: React.DragEvent<HTMLTableRowElement>) => {
            handleDragStartSelection(event as React.DragEvent<HTMLElement>);
            dragMove.handleDragStart(event);
        },
        [handleDragStartSelection, dragMove]
    );

    const handleDragEnd = useCallback(
        (event: React.DragEvent) => {
            (event.currentTarget as HTMLElement).blur();
            dragMove.handleDragEnd();
        },
        [dragMove]
    );

    const isDraggable = !!dragMoveControls && !isMultiSelectionDisabled && conditions?.isDraggable?.(itemId);
    const { dragging, DragMoveContent } = dragMove;

    return (
        <>
            {isDraggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{dragMoveControls.dragFeedbackText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <TableRow
                ref={rowRef}
                className={clsx(
                    'flex user-select-none group-hover-opacity-container',
                    (isSelected || dragMoveControls?.isActiveDropTarget) && 'bg-strong',
                    dragging && 'opacity-50',
                    className
                )}
                style={style}
                onMouseDown={handleMouseDown}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                onKeyDown={handleKeyDown}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={canBeDropTarget ? dragMoveControls?.handleDragOver : undefined}
                onDrop={canBeDropTarget ? dragMoveControls?.handleDrop : undefined}
                onDragEnter={canBeDropTarget ? dragMoveControls?.handleDragEnter : undefined}
                onDragLeave={canBeDropTarget ? dragMoveControls?.handleDragLeave : undefined}
                draggable={isDraggable}
                data-testid="drive-explorer-row"
                data-item-uid={itemId}
                tabIndex={0}
            >
                {showCheckboxColumn ? (
                    <TableCell className="m-0 flex items-center relative" data-testid="checkbox">
                        <CheckboxCell className="ml-2" uid={itemId} selectionMethods={selection.selectionMethods} />
                    </TableCell>
                ) : (
                    <TableCell className="m-0">
                        <span />
                    </TableCell>
                )}
                {cells
                    .filter((cell) => !cell.disabled)
                    .map((cell) => {
                        const renderedContent = cell.render(itemId);
                        if (renderedContent === null) {
                            return <EmptyCell key={cell.id} className={cell.className} />;
                        }

                        return <DriveExplorerCell key={cell.id} itemId={itemId} cell={cell} />;
                    })}
                {contextMenuControls && (
                    <TableCell className="m-0 flex items-center relative">
                        <ContextMenuCellWithControls
                            uid={itemId}
                            isSelected={isSelected}
                            contextMenuControls={contextMenuControls}
                            selectionMethods={selection.selectionMethods}
                        />
                    </TableCell>
                )}
            </TableRow>
        </>
    );
};

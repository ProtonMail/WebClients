import { useCallback, useEffect, useRef } from 'react';

import { DragMoveContainer, useDragMove } from '@proton/components';
import { CUSTOM_DATA_FORMAT } from '@proton/shared/lib/drive/constants';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { ItemA11yActivator } from './ItemA11yActivator';
import { CheckboxCell } from './cells/CheckboxCell';
import { ContextMenuCellWithControls } from './cells/ContextMenuCell';
import type {
    ContextMenuControls,
    DragMoveControls,
    DriveExplorerA11y,
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    GridDefinition,
} from './types';
import { useItemInteraction } from './useItemInteraction';

interface DriveExplorerGridBoxProps {
    itemId: string;
    onObserve?: (element: HTMLElement | null, uid: string) => void;
    index: number;
    selection: DriveExplorerSelection;
    grid: GridDefinition;
    events?: DriveExplorerEvents;
    conditions: DriveExplorerConditions;
    isMultiSelectionDisabled?: boolean;
    dragMoveControls?: DragMoveControls;
    showCheckboxColumn?: boolean;
    hideSelectionHighlight?: boolean;
    contextMenuControls?: ContextMenuControls;
    a11y: DriveExplorerA11y;
}

export const DriveExplorerGridBox = ({
    onObserve,
    itemId,
    index,
    selection,
    grid,
    events,
    conditions,
    isMultiSelectionDisabled,
    dragMoveControls,
    showCheckboxColumn = true,
    hideSelectionHighlight = false,
    contextMenuControls,
    a11y,
}: DriveExplorerGridBoxProps) => {
    const rowRef = useRef<HTMLDivElement>(null);
    const isSelected = selection?.selectedItems.has(itemId) ?? false;

    const dragMove = useDragMove({
        dragging: dragMoveControls?.dragging ?? false,
        setDragging: dragMoveControls?.setDragging ?? noop,
        format: CUSTOM_DATA_FORMAT,
        formatter: JSON.stringify,
    });

    const selectedItems = Array.from(selection?.selectedItems || []);
    const isDraggingSelected = isSelected;
    const dragMoveItems = isDraggingSelected ? selectedItems : [itemId];

    useEffect(() => {
        if (onObserve && rowRef.current) {
            onObserve(rowRef.current, itemId);
        }
    }, [onObserve, itemId]);

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

    const canBeDropTarget = dragMoveControls?.canDropIntoItem?.(itemId) ?? false;

    const handleDragStart = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            handleDragStartSelection(event as React.DragEvent<HTMLElement>);
            // TODO: Fix that as it only support table for now
            dragMove.handleDragStart(event as any);
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

    const isDraggable = !!dragMoveControls && !isMultiSelectionDisabled && conditions.isDraggable(itemId);
    const { dragging, DragMoveContent } = dragMove;

    return (
        <>
            {isDraggable && dragMoveControls && (
                <DragMoveContent dragging={dragging} data={dragMoveItems}>
                    <DragMoveContainer>{dragMoveControls.dragFeedbackText}</DragMoveContainer>
                </DragMoveContent>
            )}
            <div
                ref={rowRef}
                className={clsx(
                    'item-a11y-container relative bg-norm overflow-hidden flex flex-column text-left rounded border group-hover-opacity-container',
                    ((!hideSelectionHighlight && isSelected) || dragMoveControls?.isActiveDropTarget) &&
                        'border-primary',
                    dragging && 'opacity-50'
                )}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={canBeDropTarget ? dragMoveControls?.handleDragOver : undefined}
                onDrop={canBeDropTarget ? dragMoveControls?.handleDrop : undefined}
                onDragEnter={canBeDropTarget ? dragMoveControls?.handleDragEnter : undefined}
                onDragLeave={canBeDropTarget ? dragMoveControls?.handleDragLeave : undefined}
                onContextMenu={handleContextMenu}
                draggable={isDraggable}
                data-testid="grid-item"
                data-drive-explorer-item-uid={itemId}
            >
                <ItemA11yActivator
                    ariaLabel={a11y.getItemAriaLabel({ uid: itemId, isSelected, index })}
                    isSelected={isSelected}
                    onMouseDown={handleMouseDown}
                    onClick={handleClick}
                    onDoubleClick={handleDoubleClick}
                    onKeyDown={handleKeyDown}
                />
                {showCheckboxColumn && (
                    <CheckboxCell
                        className="absolute top-0 left-0 pl-0.5 pt-0.5 z-up"
                        uid={itemId}
                        selectionMethods={selection.selectionMethods}
                    />
                )}
                <div className="flex items-center justify-center flex-1 w-full relative cursor-pointer">
                    {grid.mainContent(itemId)}
                </div>
                <div
                    className="flex items-center border-top mt-auto relative h-custom w-full"
                    style={{
                        '--h-custom': '2.625rem',
                        paddingBlock: 0,
                        paddingInline: '2.5rem',
                    }}
                >
                    {grid.name(itemId)}
                    {contextMenuControls && (
                        <div className="absolute right-0 mr-1 z-up">
                            <ContextMenuCellWithControls
                                uid={itemId}
                                isSelected={isSelected}
                                contextMenuControls={contextMenuControls}
                                selectionMethods={selection.selectionMethods}
                            />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

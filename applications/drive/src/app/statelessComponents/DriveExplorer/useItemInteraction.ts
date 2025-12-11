import { useCallback } from 'react';

import type { DragMoveControls, DriveExplorerConditions, DriveExplorerEvents, DriveExplorerSelection } from './types';

interface UseItemInteractionParams {
    itemId: string;
    isSelected: boolean;
    selection: DriveExplorerSelection;
    events?: DriveExplorerEvents;
    conditions?: DriveExplorerConditions;
    isMultiSelectionDisabled?: boolean;
    dragMoveControls?: DragMoveControls;
}

export const useItemInteraction = ({
    itemId,
    isSelected,
    selection,
    events,
    conditions,
    isMultiSelectionDisabled,
    dragMoveControls,
}: UseItemInteractionParams) => {
    const performSelection = useCallback(
        (event: React.MouseEvent) => {
            if (event.shiftKey && !isMultiSelectionDisabled) {
                selection?.selectionMethods.toggleRange(itemId);
            } else if ((event.ctrlKey || event.metaKey) && !isMultiSelectionDisabled) {
                selection?.selectionMethods.toggleSelectItem(itemId);
            } else {
                selection?.selectionMethods.selectItem(itemId);
            }
        },
        [isMultiSelectionDisabled, itemId, selection?.selectionMethods]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
            const target = event.target as HTMLElement;

            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('[role="button"]')
            ) {
                return;
            }

            performSelection(event);

            events?.onItemClick?.(itemId, event);
        },
        [performSelection, events, itemId]
    );

    const handleClick = useCallback(
        (event: React.MouseEvent) => {
            const target = event.target as HTMLElement;

            if (
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.closest('button') ||
                target.closest('input') ||
                target.closest('[role="button"]')
            ) {
                return;
            }

            event.stopPropagation();

            performSelection(event);

            events?.onItemClick?.(itemId, event);
        },
        [performSelection, events, itemId]
    );

    const isDoubleClickable = conditions?.isDoubleClickable?.(itemId);

    const handleDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            if (isDoubleClickable) {
                events?.onItemDoubleClick?.(itemId, event);
            }
        },
        [isDoubleClickable, events, itemId]
    );

    const handleContextMenu = useCallback(
        (event: React.MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();

            if (!isSelected) {
                selection?.selectionMethods.selectItem(itemId);
            }

            events?.onItemContextMenu?.(itemId, event);
        },
        [itemId, isSelected, selection, events]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                events?.onItemDoubleClick?.(itemId, event);
            }
        },
        [itemId, events]
    );

    const handleDragStart = useCallback(
        (event: React.DragEvent<HTMLElement>) => {
            if (!dragMoveControls) {
                event.preventDefault();
                return;
            }

            if (!isSelected) {
                selection?.selectionMethods.selectItem(itemId);
            }
        },
        [itemId, isSelected, selection, dragMoveControls]
    );

    return {
        handleMouseDown,
        handleClick,
        handleDoubleClick,
        handleContextMenu,
        handleKeyDown,
        handleDragStart,
    };
};

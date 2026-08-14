import { useCallback, useEffect, useRef } from 'react';

import type { DragMoveControls, DriveExplorerConditions, DriveExplorerEvents, DriveExplorerSelection } from './types';

const TOUCH_DOUBLE_TAP_MS = 500;

// A tap is allowed to wander a little: a finger never lands perfectly still, and a
// mouse click in Chrome's touch emulation drifts a pixel or two.
const TOUCH_MOVE_TOLERANCE_PX = 10;

interface UseItemInteractionParams {
    itemId: string;
    isSelected: boolean;
    selection: DriveExplorerSelection;
    events?: DriveExplorerEvents;
    conditions: DriveExplorerConditions;
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
            // Right click
            if (event.button === 2) {
                return;
            }

            // Preserve multi-selection on mousedown so dragging doesn't collapse it.
            // handleClick (mouse-up) handles the single-select reset for plain clicks.
            const hasModifier = event.shiftKey || event.ctrlKey || event.metaKey;
            if (!isSelected || hasModifier) {
                performSelection(event);
            }

            events?.onItemClick?.(itemId, event);
        },
        [performSelection, events, itemId, isSelected]
    );

    const handleClick = useCallback(
        (event: React.MouseEvent) => {
            // Right click
            if (event.button === 2) {
                return;
            }

            event.stopPropagation();

            performSelection(event);

            events?.onItemClick?.(itemId, event);
        },
        [performSelection, events, itemId]
    );

    const isDoubleClickable = conditions.isDoubleClickable(itemId);

    // Touch cannot rely on the browser synthesizing a dblclick out of two taps: while
    // the page is zoomable - a phone or tablet set to "Request desktop site", Chrome's
    // responsive mode - the second tap is claimed by the double-tap-to-zoom gesture and
    // never reaches us. So the taps are counted here instead.
    const tapStartRef = useRef<{ x: number; y: number } | null>(null);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const openedByTouchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const openedByTouchRef = useRef(false);

    useEffect(
        () => () => {
            clearTimeout(tapTimerRef.current);
            clearTimeout(openedByTouchTimerRef.current);
        },
        []
    );

    const handleDoubleClick = useCallback(
        (event: React.MouseEvent) => {
            // The touch path already opened this item; ignore the dblclick some
            // browsers still synthesize for the second tap so it does not open twice.
            if (openedByTouchRef.current) {
                return;
            }
            if (isDoubleClickable) {
                events?.onItemDoubleClick?.(itemId, event);
            }
        },
        [isDoubleClickable, events, itemId]
    );

    const handleTouchStart = useCallback((event: React.TouchEvent) => {
        const touch = event.changedTouches[0];
        tapStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
    }, []);

    const handleTouchMove = useCallback((event: React.TouchEvent) => {
        const start = tapStartRef.current;
        const touch = event.changedTouches[0];
        if (!start || !touch) {
            return;
        }
        const hasLeftTapArea =
            Math.abs(touch.clientX - start.x) > TOUCH_MOVE_TOLERANCE_PX ||
            Math.abs(touch.clientY - start.y) > TOUCH_MOVE_TOLERANCE_PX;
        if (hasLeftTapArea) {
            tapStartRef.current = null;
        }
    }, []);

    const handleTouchCancel = useCallback(() => {
        tapStartRef.current = null;
    }, []);

    const handleTouchEnd = useCallback(
        (event: React.TouchEvent) => {
            const wasTap = tapStartRef.current !== null;
            tapStartRef.current = null;

            // Scrolling rather than tapping: also forget any pending first tap.
            if (!wasTap) {
                clearTimeout(tapTimerRef.current);
                tapTimerRef.current = undefined;
                return;
            }

            if (!tapTimerRef.current) {
                tapTimerRef.current = setTimeout(() => {
                    tapTimerRef.current = undefined;
                }, TOUCH_DOUBLE_TAP_MS);
                return;
            }

            clearTimeout(tapTimerRef.current);
            tapTimerRef.current = undefined;

            if (!isDoubleClickable) {
                return;
            }

            openedByTouchRef.current = true;
            clearTimeout(openedByTouchTimerRef.current);
            openedByTouchTimerRef.current = setTimeout(() => {
                openedByTouchRef.current = false;
            }, TOUCH_DOUBLE_TAP_MS);

            events?.onItemDoubleClick?.(itemId, event);
        },
        [isDoubleClickable, events, itemId]
    );

    const handleContextMenu = useCallback(
        (event: React.MouseEvent) => {
            // Skip synthetic bubbles from portalled descendants (modals/popovers):
            // React bubbles their events back through the row's handler even though
            // their real DOM lives outside the row. Inline (non-portalled) children
            // bubble naturally and must call stopPropagation themselves to opt out.
            const currentTarget = event.currentTarget as HTMLElement;
            const target = event.target as HTMLElement;
            if (!currentTarget.contains(target)) {
                return;
            }
            event.preventDefault();
            if (!isSelected) {
                selection?.selectionMethods.selectItem(itemId);
            }
            events?.onItemContextMenu?.(itemId, event);
        },
        [itemId, isSelected, selection, events]
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                events?.onItemDoubleClick?.(itemId, event);
            } else if (event.key === ' ') {
                event.preventDefault();
                selection?.selectionMethods.toggleSelectItem(itemId);
            }
        },
        [itemId, events, selection?.selectionMethods]
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
        handleTouchStart,
        handleTouchMove,
        handleTouchCancel,
        handleTouchEnd,
        handleContextMenu,
        handleKeyDown,
        handleDragStart,
    };
};

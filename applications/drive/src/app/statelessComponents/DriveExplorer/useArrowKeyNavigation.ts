import { type RefObject, useEffect, useRef } from 'react';

export type ScrollToRowAlign = 'auto' | 'center';

interface UseArrowKeyNavigationParams {
    containerRef: RefObject<HTMLElement | null>;
    itemIds: string[];
    itemsPerRow: number;
    /** Scrolls the virtualized list to a row, using the virtualizer's measured row sizes */
    scrollToRow: (rowIndex: number, align: ScrollToRowAlign) => void;
}

const ACTIVATOR_SELECTOR = '[data-item-activator]';
const ITEM_UID_ATTR = 'data-drive-explorer-item-uid';
const ITEM_UID_SELECTOR = `[${ITEM_UID_ATTR}]`;
// After a long jump the virtualizer can take a few frames to render the target row
const MAX_FOCUS_FRAMES = 10;

// Focus-first keyboard navigation. Arrow keys move DOM focus between item
// activators; selection is only changed by Space (handled in useItemInteraction).
// Virtualizer-aware: the virtualizer scrolls to the target row, as only it knows
// the measured row sizes, and we focus it as soon as it is rendered.
export const useArrowKeyNavigation = ({
    containerRef,
    itemIds,
    itemsPerRow,
    scrollToRow,
}: UseArrowKeyNavigationParams) => {
    // Kept across effect re-runs: callers often pass a new itemIds array on each render,
    // which must not cancel a focus still waiting for its row
    const frameIdRef = useRef<number>(undefined);

    useEffect(
        () => () => {
            if (frameIdRef.current !== undefined) {
                cancelAnimationFrame(frameIdRef.current);
            }
        },
        []
    );

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const cancelPendingFocus = () => {
            if (frameIdRef.current !== undefined) {
                cancelAnimationFrame(frameIdRef.current);
                frameIdRef.current = undefined;
            }
        };

        const focusItemAtIndex = (index: number, align: ScrollToRowAlign) => {
            const uid = itemIds[index];
            if (!uid) {
                return;
            }
            const selector = `[${ITEM_UID_ATTR}="${uid}"] ${ACTIVATOR_SELECTOR}`;

            const tryFocus = () => {
                const activator = container.querySelector<HTMLElement>(selector);
                if (!activator) {
                    return false;
                }
                // The virtualizer owns the scroll position, focusing must not scroll on its own
                activator.focus({ preventScroll: true });
                return true;
            };

            const focusWhenRendered = (framesLeft: number) => {
                frameIdRef.current = undefined;
                if (tryFocus() || framesLeft === 0) {
                    return;
                }
                frameIdRef.current = requestAnimationFrame(() => focusWhenRendered(framesLeft - 1));
            };

            // A newer key press replaces the pending focus
            cancelPendingFocus();
            scrollToRow(Math.floor(index / itemsPerRow), align);
            focusWhenRendered(MAX_FOCUS_FRAMES);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (itemIds.length === 0) {
                return;
            }
            const target = event.target as HTMLElement | null;
            const focusedRow = target?.closest<HTMLElement>(ITEM_UID_SELECTOR);
            const focusedUid = focusedRow?.dataset.driveExplorerItemUid;
            const currentIndex = focusedUid ? itemIds.indexOf(focusedUid) : -1;
            const last = itemIds.length - 1;
            const isGrid = itemsPerRow > 1;

            switch (event.key) {
                case 'ArrowDown': {
                    event.preventDefault();
                    const next = currentIndex < 0 ? 0 : Math.min(currentIndex + itemsPerRow, last);
                    focusItemAtIndex(next, 'auto');
                    return;
                }
                case 'ArrowUp': {
                    event.preventDefault();
                    const prev = currentIndex < 0 ? last : Math.max(currentIndex - itemsPerRow, 0);
                    focusItemAtIndex(prev, 'auto');
                    return;
                }
                case 'ArrowRight': {
                    if (!isGrid) {
                        return;
                    }
                    event.preventDefault();
                    const next = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, last);
                    focusItemAtIndex(next, 'auto');
                    return;
                }
                case 'ArrowLeft': {
                    if (!isGrid) {
                        return;
                    }
                    event.preventDefault();
                    const prev = currentIndex < 0 ? last : Math.max(currentIndex - 1, 0);
                    focusItemAtIndex(prev, 'auto');
                    return;
                }
                case 'Home': {
                    event.preventDefault();
                    focusItemAtIndex(0, 'center');
                    return;
                }
                case 'End': {
                    event.preventDefault();
                    focusItemAtIndex(last, 'center');
                    return;
                }
                default:
                    return;
            }
        };

        container.addEventListener('keydown', handleKeyDown);
        return () => {
            container.removeEventListener('keydown', handleKeyDown);
        };
    }, [containerRef, itemIds, itemsPerRow, scrollToRow]);
};

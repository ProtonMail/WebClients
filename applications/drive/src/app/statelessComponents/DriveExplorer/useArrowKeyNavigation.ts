import { type RefObject, useEffect } from 'react';

interface UseArrowKeyNavigationParams {
    containerRef: RefObject<HTMLElement | null>;
    itemIds: string[];
    itemsPerRow: number;
    rowHeightWithGap: number;
}

const ACTIVATOR_SELECTOR = '[data-item-activator]';
const ITEM_UID_ATTR = 'data-drive-explorer-item-uid';
const ITEM_UID_SELECTOR = `[${ITEM_UID_ATTR}]`;

// Focus-first keyboard navigation. Arrow keys move DOM focus between item
// activators; selection is only changed by Space (handled in useItemInteraction).
// Virtualizer-aware: when the target row is outside the rendered window, we
// scroll the container first and refocus on the next frame.
export const useArrowKeyNavigation = ({
    containerRef,
    itemIds,
    itemsPerRow,
    rowHeightWithGap,
}: UseArrowKeyNavigationParams) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const focusItemAtIndex = (index: number, scroll: 'nearest' | 'center') => {
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
                const row = activator.closest<HTMLElement>(ITEM_UID_SELECTOR) ?? activator;
                row.scrollIntoView({ block: scroll });
                activator.focus();
                return true;
            };

            if (tryFocus()) {
                return;
            }

            const rowIndex = Math.floor(index / itemsPerRow);
            const target =
                scroll === 'center'
                    ? Math.max(0, rowIndex * rowHeightWithGap - container.clientHeight / 2)
                    : rowIndex * rowHeightWithGap;
            container.scrollTop = target;
            requestAnimationFrame(() => {
                tryFocus();
            });
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
                    focusItemAtIndex(next, 'nearest');
                    return;
                }
                case 'ArrowUp': {
                    event.preventDefault();
                    const prev = currentIndex < 0 ? last : Math.max(currentIndex - itemsPerRow, 0);
                    focusItemAtIndex(prev, 'nearest');
                    return;
                }
                case 'ArrowRight': {
                    if (!isGrid) {
                        return;
                    }
                    event.preventDefault();
                    const next = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, last);
                    focusItemAtIndex(next, 'nearest');
                    return;
                }
                case 'ArrowLeft': {
                    if (!isGrid) {
                        return;
                    }
                    event.preventDefault();
                    const prev = currentIndex < 0 ? last : Math.max(currentIndex - 1, 0);
                    focusItemAtIndex(prev, 'nearest');
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
    }, [containerRef, itemIds, itemsPerRow, rowHeightWithGap]);
};

import type { MouseEvent } from 'react';
import { useCallback, useRef } from 'react';

import type { BrowserItemId } from '../interface';
import { useSelection } from '../state/useSelection';

const DOUBLE_CLICK_MS = 500;

interface Options {
    id: BrowserItemId;
    isItemLocked?: boolean;
    isMultiSelectionDisabled?: boolean;

    onItemOpen?: (id: BrowserItemId) => void;
    onItemContextMenu?: (e: MouseEvent<HTMLElement>) => void;
}

function useFileBrowserItem({
    id,
    isItemLocked,
    isMultiSelectionDisabled = false,

    onItemContextMenu,
    onItemOpen,
}: Options) {
    const selection = useSelection();

    // Timer for click and double click detection.
    const clickTimerIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const touchStarted = useRef(false);

    const isSelected = selection?.isSelected(id);
    const unlessDisabled = <A extends any[], R>(fn?: (...args: A) => R) => (isItemLocked ? undefined : fn);

    const handleClick = unlessDisabled(
        useCallback(
            (e: React.MouseEvent<HTMLDivElement>) => {
                e.stopPropagation();
                if (clickTimerIdRef.current) {
                    clearTimeout(clickTimerIdRef.current);
                    clickTimerIdRef.current = undefined;
                    if (id) {
                        onItemOpen?.(id);
                    }
                } else {
                    // We do selection right away, not in timeout, because then
                    // would app look like slow. There is no harm to select
                    // items right away even if we navigate to different folder
                    // or show file preview in few miliseconds.
                    if (!id) {
                        return;
                    }

                    if (e.shiftKey && !isMultiSelectionDisabled) {
                        selection?.toggleRange(id);
                    } else if ((e.ctrlKey || e.metaKey) && !isMultiSelectionDisabled) {
                        selection?.toggleSelectItem(id);
                    } else {
                        selection?.selectItem(id);
                    }

                    clickTimerIdRef.current = setTimeout(() => {
                        clickTimerIdRef.current = undefined;
                    }, DOUBLE_CLICK_MS);
                }
            },
            [selection?.toggleRange, selection?.toggleSelectItem, onItemOpen]
        )
    );

    const handleKeyDown = unlessDisabled(
        useCallback(
            (e: React.KeyboardEvent<HTMLTableRowElement>) => {
                if (e.key === ' ' || e.key === 'Enter') {
                    onItemOpen?.(id);
                }
            },
            [onItemOpen]
        )
    );

    const handleTouchStart = unlessDisabled(
        useCallback(
            (e: React.TouchEvent<HTMLTableRowElement>) => {
                e.stopPropagation();
                touchStarted.current = true;
            },
            [touchStarted]
        )
    );

    const handleTouchCancel = unlessDisabled(
        useCallback(() => {
            if (touchStarted.current) {
                touchStarted.current = false;
            }
        }, [touchStarted])
    );

    const handleTouchEnd = unlessDisabled(
        useCallback(() => {
            if (touchStarted.current) {
                onItemOpen?.(id);
            }
            touchStarted.current = false;
        }, [touchStarted, onItemOpen])
    );

    const onContextMenu = useCallback(
        (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation();

            if (isItemLocked) {
                return;
            }
            e.preventDefault();

            if (!isSelected) {
                selection?.selectItem(id);
            }

            onItemContextMenu?.(e);
        },
        [onItemContextMenu, selection?.selectItem, selection?.selectedItemIds]
    );

    const handleMouseDown = useCallback(() => document.getSelection()?.removeAllRanges(), []);

    return {
        isSelected,
        itemHandlers: {
            onTouchCancel: handleTouchCancel,
            onTouchMove: handleTouchCancel,
            onTouchStart: handleTouchStart,
            onTouchEnd: handleTouchEnd,
            onClick: handleClick,
            onKeyDown: handleKeyDown,
            onMouseDown: handleMouseDown,
            onContextMenu,
        },
    };
}

export default useFileBrowserItem;

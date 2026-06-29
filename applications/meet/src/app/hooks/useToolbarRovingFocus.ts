import { useCallback, useEffect, useRef } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';

type ToolbarOrientation = 'horizontal' | 'vertical' | 'both';

interface UseToolbarRovingFocusOptions {
    /**
     * Which arrow keys move focus between items. Defaults to horizontal,
     * matching a left-to-right control bar.
     */
    orientation?: ToolbarOrientation;
}

/**
 * Returns every enabled, currently visible button inside the toolbar, in DOM order.
 * Visibility is checked via `offsetParent` so controls hidden through responsive
 * CSS (e.g. `hidden lg:flex`) are excluded from the roving order.
 */
const getFocusableItems = (toolbar: HTMLElement): HTMLElement[] =>
    Array.from(toolbar.querySelectorAll<HTMLElement>('button:not([disabled])')).filter(
        (el) => el.offsetParent !== null
    );

/**
 * Implements the WAI-ARIA Authoring Practices toolbar keyboard pattern:
 * https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 *
 * The toolbar is a single tab stop (roving `tabindex`): Tab moves focus into and
 * out of the whole cluster, while Arrow/Home/End move focus between controls.
 * Tab stops are scanned from the DOM, so heterogeneous child buttons work without
 * each having to opt in via a prop.
 */
export const useToolbarRovingFocus = <T extends HTMLElement = HTMLDivElement>({
    orientation = 'horizontal',
}: UseToolbarRovingFocusOptions = {}) => {
    const toolbarRef = useRef<T>(null);

    // Keep exactly one visible item in the tab order (tabIndex 0); the rest are -1.
    const syncTabStops = useCallback((preferredActive?: HTMLElement) => {
        const toolbar = toolbarRef.current;
        if (!toolbar) {
            return;
        }

        const items = getFocusableItems(toolbar);
        if (!items.length) {
            return;
        }

        const active =
            (preferredActive && items.includes(preferredActive) && preferredActive) ||
            items.find((item) => item.tabIndex === 0) ||
            items[0];

        items.forEach((item) => {
            item.tabIndex = item === active ? 0 : -1;
        });
    }, []);

    // Re-sync after every render: this component re-renders on the breakpoint and
    // state changes that add/remove/hide controls, so this keeps a valid tab stop
    // even when visibility flips through CSS media queries (no DOM mutation).
    useEffect(() => {
        syncTabStops();
    });

    const handleFocus = useCallback(
        (event: FocusEvent<T>) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'BUTTON') {
                syncTabStops(target);
            }
        },
        [syncTabStops]
    );

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<T>) => {
            const { key } = event;

            const horizontal = orientation === 'horizontal' || orientation === 'both';
            const vertical = orientation === 'vertical' || orientation === 'both';

            const isNext = (horizontal && key === 'ArrowRight') || (vertical && key === 'ArrowDown');
            const isPrev = (horizontal && key === 'ArrowLeft') || (vertical && key === 'ArrowUp');
            const isFirst = key === 'Home';
            const isLast = key === 'End';

            if (!isNext && !isPrev && !isFirst && !isLast) {
                return;
            }

            const toolbar = toolbarRef.current;
            if (!toolbar) {
                return;
            }

            const items = getFocusableItems(toolbar);
            if (!items.length) {
                return;
            }

            const currentIndex = items.indexOf(document.activeElement as HTMLElement);
            if (currentIndex === -1) {
                return;
            }

            event.preventDefault();

            let nextIndex: number;
            if (isFirst) {
                nextIndex = 0;
            } else if (isLast) {
                nextIndex = items.length - 1;
            } else if (isNext) {
                nextIndex = (currentIndex + 1) % items.length;
            } else {
                nextIndex = (currentIndex - 1 + items.length) % items.length;
            }

            const nextItem = items[nextIndex];
            syncTabStops(nextItem);
            nextItem.focus();
        },
        [orientation, syncTabStops]
    );

    return {
        toolbarRef,
        toolbarProps: {
            ref: toolbarRef,
            onKeyDown: handleKeyDown,
            onFocus: handleFocus,
        },
    };
};

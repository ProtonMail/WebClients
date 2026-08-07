import type { RefObject } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';

/**
 * Tells whether the category tabs should drop their labels and show icons only.
 *
 * The labels are dropped when there is not enough horizontal space. How much space is needed
 * depends on the number of categories enabled, the translation, and the unread count of each of
 * them, so it cannot be expressed as a media query and has to be measured.
 */
export const useCategoriesTabsCompact = (barRef: RefObject<HTMLElement>, tabs: CategoryTab[]) => {
    const [compact, setCompact] = useState(false);
    const fullWidths = useRef(new WeakMap<Element, number>());

    // The tabs array is a new reference on every render, only its content matters here.
    const tabIds = tabs.map((tab) => tab.id).join();

    useLayoutEffect(() => {
        const bar = barRef.current;
        if (!bar) {
            return;
        }

        let frame: number;

        // Width the tab would need to show its whole label. A tab that is already ellipsised
        // measures at its clipped width, so the hidden part is read back from the ghost.
        const fullWidth = (tab: HTMLElement, isCompact: boolean) => {
            const ghost = tab.querySelector<HTMLElement>('.tab-label-ghost');
            const truncated = ghost ? ghost.scrollWidth - ghost.clientWidth : 0;
            const measured = tab.getBoundingClientRect().width + truncated;

            if (isCompact) {
                // Labels are hidden, the DOM can no longer tell us what they need. Reusing the
                // last full measurement is what lets the bar leave compact mode when it grows.
                return fullWidths.current.get(tab) ?? measured;
            }

            fullWidths.current.set(tab, measured);

            return measured;
        };

        const measure = () => {
            const isCompact = bar.classList.contains('tabs-compact');
            const tabs = [...bar.querySelectorAll<HTMLElement>('.tab-wrapper')];
            const needed = tabs.reduce((total, tab) => total + fullWidth(tab, isCompact), 0);

            const { paddingInlineStart, paddingInlineEnd } = getComputedStyle(bar);
            const available = bar.clientWidth - parseFloat(paddingInlineStart) - parseFloat(paddingInlineEnd);

            // One pixel of slack per tab, sub-pixel rounding alone must not trigger compact mode.
            setCompact(needed - available > tabs.length);
        };

        // Measuring inside the observer callback would resize the bar and loop, the frame defers
        // the write to after layout has settled.
        const observer = new ResizeObserver(() => {
            frame = requestAnimationFrame(measure);
        });

        // The tabs are observed too: a counter appearing or a longer translation changes what is
        // needed without the bar itself ever resizing.
        observer.observe(bar);
        bar.querySelectorAll('.tab-wrapper').forEach((tab) => observer.observe(tab));

        measure();

        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [barRef, tabIds]);

    return compact;
};

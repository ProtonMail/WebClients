import { type RefObject, useEffect } from 'react';

import createScrollIntoView from '@proton/shared/lib/helpers/createScrollIntoView';
import { getScrollParent } from '@proton/shared/lib/helpers/dom';

/** Long enough for a slow page to finish arriving, short enough not to run all session. */
const MAX_DURATION_MS = 10_000;

/**
 * Smoothly scrolls `ref` into view, following it while the page settles.
 *
 * On first render the sections above the target are still growing as their data arrives,
 * which moves the target. `scrollIntoView({ behavior: 'smooth' })` can't cope with that:
 * it resolves its destination once, then animates there over ~500ms while owning the
 * scroll position, so it both lands short and overwrites any correction made meanwhile.
 *
 * `createScrollIntoView` re-measures the target every frame instead, so it follows the
 * target rather than missing it, and in `indefinite` mode keeps holding it in place as
 * later content arrives. It runs until cancelled — on unmount, after `MAX_DURATION_MS`,
 * or as soon as the user scrolls, so a slow section can't yank them away from whatever
 * they started reading.
 *
 * `retriggerKey` restarts the scroll whenever it changes. Pass `location.key` so that
 * clicking the same anchor twice scrolls again — the hash is identical both times, but
 * each click pushes a new history entry with a fresh key.
 */
const useScrollIntoView = (ref: RefObject<HTMLElement>, enabled: boolean, retriggerKey?: string) => {
    useEffect(() => {
        const el = ref.current;
        if (!enabled || !el) {
            return;
        }

        const scroller = getScrollParent(el);
        const offset = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;

        const cancelScroll = createScrollIntoView(el, scroller, true, offset);

        // `indefinite` means exactly that, so without this the loop would keep running —
        // and keep holding the target — for as long as the page stays open.
        const timeout = window.setTimeout(cancelScroll, MAX_DURATION_MS);

        // If the user starts scrolling themselves, don't keep pulling them back. Has to be
        // input events rather than 'scroll', which the scrolling above triggers itself.
        // 'mousedown' covers dragging the scrollbar, which fires none of the others.
        const abortEvents = ['wheel', 'touchmove', 'keydown', 'mousedown'] as const;

        const stop = () => {
            clearTimeout(timeout);
            cancelScroll();
            abortEvents.forEach((event) => window.removeEventListener(event, stop));
        };

        abortEvents.forEach((event) => window.addEventListener(event, stop, { passive: true }));

        return stop;
    }, [enabled, retriggerKey]);
};

export default useScrollIntoView;

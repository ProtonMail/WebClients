import { type RefObject, useEffect } from 'react';
import { useLocation } from 'react-router';

import { SIDEBAR_SELECTOR } from './constants';

/**
 * Moves focus to the main content when a settings page is opened from the sidebar,
 * so keyboard and screen reader users land on the new page instead of staying in the navigation.
 *
 * Focus moves only if it is inside the sidebar when the page changes: navigations started
 * elsewhere (links in the content, search, initial load) keep focus where it is.
 * The page title is focused when it exists, so screen readers announce it, with the main area as fallback.
 */
export const useFocusMainOnNavigation = (
    mainAreaRef: RefObject<HTMLElement | null>,
    titleRef: RefObject<HTMLElement | null>
) => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        /* Fragments are handled by the hook that scrolls to the targeted section. */
        if (hash) {
            return;
        }
        if (!document.activeElement?.closest(SIDEBAR_SELECTOR)) {
            return;
        }
        const target = titleRef.current ?? mainAreaRef.current;
        /* Scroll position is handled by `useScrollRestoration`. */
        target?.focus({ preventScroll: true });
    }, [pathname, hash]);
};

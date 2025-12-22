import type { MaybeNull } from '@proton/pass/types';
import { getParent } from '@proton/pass/utils/dom/tree';

/** Resolves the first parent element which can be scrolled vertically.
 * Traverses up the DOM tree until finding a scrollable element or reaching
 * the optional boundary. Also tracks if any stacking context exists between
 * the starting element and the scroll parent. While walking up to the scrollable
 * element: if no stacking contexts were found, this means that any absolutely
 * positioned child would not properly follow the scroll */
export const scrollableParent = (el: MaybeNull<HTMLElement>): HTMLElement => {
    if (el === document.body || el === null) return document.body;

    const styles = getComputedStyle(el);
    const scrollable = styles.overflowY === 'auto' || styles.overflowY === 'scroll';

    return scrollable ? el : scrollableParent(getParent(el));
};

import type { MaybeNull } from '@proton/pass/types';
import { getParent } from '@proton/pass/utils/dom/tree';

/** Checks if an element has vertical scrolling enabled (auto or scroll) */
export const isScrollable = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    return style.overflowY === 'auto' || style.overflowY === 'scroll';
};

/** Resolves the first parent element which can be scrolled vertically.
 * Traverses up the DOM tree until finding a scrollable element or reaching
 * the optional boundary. */
export const scrollableParent = (el: MaybeNull<HTMLElement>, boundary?: HTMLElement): HTMLElement => {
    if (el === document.body || el === null) return document.body;
    if (boundary && boundary === el) return el;
    return isScrollable(el) ? el : scrollableParent(getParent(el), boundary);
};

import type { MaybeNull } from '@proton/pass/types';

const isScrollable = (el: HTMLElement) => {
    const style = window.getComputedStyle(el);
    return style.overflowY === 'auto' || style.overflowY === 'scroll';
};

/** Resolves the first parent element which can be scrolled vertically */
export const findScrollableParent = (el: MaybeNull<HTMLElement>): HTMLElement => {
    if (el === document.body || el === null) return document.body;
    return isScrollable(el) ? el : findScrollableParent(el.parentElement);
};

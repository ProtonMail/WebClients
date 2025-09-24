export const getNthParent = (el: HTMLElement, n: number): HTMLElement =>
    n > 0 && el.parentElement ? getNthParent(el.parentElement, n - 1) : el;

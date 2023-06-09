import type { MaybeNull } from '@proton/pass/types';

const getElementZIndex = (el: MaybeNull<HTMLElement>): MaybeNull<number> => {
    if (!el) return null;

    const zIndex = window.getComputedStyle(el).getPropertyValue('z-index');
    const value = parseInt(zIndex, 10);
    return isNaN(value) ? null : value;
};

/* recursively resolves the z-index postitioning of an element
 * by walking up the parents and checking for a valid z-index
 * value. When we get the first match, as a heuristic, keep on
 * walking up until the next match and resolve the maximum value */
export const inferZIndexFromParent = (el: HTMLElement, returnEarly: boolean = false): number => {
    const parent = el.parentElement;

    const startZIndex = getElementZIndex(el) ?? 0;
    const parentZIndex = getElementZIndex(parent);

    /* if we've reached the body tag without any results */
    if (!parent) return Math.max(startZIndex, parentZIndex ?? 0);

    /* parent does not have a zIndex property : walk-up */
    if (!parentZIndex) return Math.max(startZIndex, inferZIndexFromParent(parent, returnEarly));

    const value = Math.max(startZIndex, parentZIndex);
    return returnEarly ? value : Math.max(value, inferZIndexFromParent(parent, true));
};

export const getMaxZIndex = (rootElement: HTMLElement) => {
    const zIndex = inferZIndexFromParent(rootElement);

    const childrenZIndex = Array.from(rootElement.querySelectorAll('*'), (el) =>
        parseInt(window.getComputedStyle(el).zIndex, 10)
    ).filter((zIndex) => !Number.isNaN(zIndex));

    return Math.max(zIndex, ...childrenZIndex);
};

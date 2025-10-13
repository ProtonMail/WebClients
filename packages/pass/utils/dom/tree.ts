import type { MaybeNull } from '@proton/pass/types';

/** Gets the parent of an element, traversing through Shadow DOM boundaries.
 * Checks: slotted parent → regular parent → shadow host */
export const getParent = (el: HTMLElement): MaybeNull<HTMLElement> => {
    if (el.assignedSlot) return el.assignedSlot;
    if (el.parentElement) return el.parentElement;

    const root = el.getRootNode();
    if (root !== document.ownerDocument) {
        const { host } = root as ShadowRoot;
        return host as HTMLElement;
    }

    return null;
};

/** Gets the nth parent of an element */
export const getNthParent = (el: HTMLElement, n: number): HTMLElement => {
    if (n === 0) return el;
    const parent = getParent(el);
    return parent ? getNthParent(parent, n - 1) : el;
};

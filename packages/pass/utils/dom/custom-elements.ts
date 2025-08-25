import type { Maybe } from '@proton/pass/types';

/** Traverses up the DOM to find the nearest slot element
 * that contains or is assigned to the given element. */
export const findAssignedSlot = (element: HTMLElement): Maybe<HTMLSlotElement> => {
    if (element.assignedSlot) return element.assignedSlot;

    let current = element.parentElement;

    while (current) {
        if (current.assignedSlot) return current.assignedSlot;
        current = current.parentElement;
    }
};

import type { Maybe } from '../../types';
import { safeCall } from '../fp/safe-call';

/** Traverses up the DOM to find the nearest slot element
 * that contains or is assigned to the given element. */
export const findAssignedSlot = safeCall((element: HTMLElement): Maybe<HTMLSlotElement> => {
    if (element.assignedSlot) return element.assignedSlot;

    let current = element.parentElement;

    while (current) {
        if (current.assignedSlot) return current.assignedSlot;
        current = current.parentElement;
    }
});

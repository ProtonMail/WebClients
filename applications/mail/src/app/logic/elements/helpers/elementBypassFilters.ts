import { MARK_AS_STATUS } from '../../../hooks/actions/useMarkAs';
import { Element } from '../../../models/element';

export const getElementsToBypassFilter = (elements: Element[], action: MARK_AS_STATUS, unreadFilter?: number) => {
    let elementsToBypass: Element[] = [];
    let elementsToRemove: Element[] = elements;

    // If no unreadFilter, there is no filter applied, so no need to bypass filters
    if (unreadFilter === undefined) {
        return { elementsToBypass: [], elementsToRemove: [] };
    } else {
        /**
         * IF
         * - The filter UNREAD is currently applied and elements are marked as UNREAD
         * - The filter READ is currently applied and elements are marked as READ
         *
         * Then we don't need to add elements in the bypass array.
         * However, it's possible that they are in the bypass array already. In that case we want to remove them from the array
         *
         * => We will return {elementsToByPass: [], elementsToRemove: elements}
         */
        const dontNeedBypass =
            (unreadFilter > 0 && action === MARK_AS_STATUS.UNREAD) ||
            (unreadFilter === 0 && action === MARK_AS_STATUS.READ);

        /**
         * Otherwise, we need to push the items in the bypass array
         *
         * => We will return {elementsToByPass: elements, elementsToRemove: []}
         */
        if (!dontNeedBypass) {
            elementsToBypass = elements;
            elementsToRemove = [];
        }
    }

    return { elementsToBypass, elementsToRemove };
};

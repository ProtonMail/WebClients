import { pixelParser } from './computed-styles';
import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() !== '');

/* heuristic value for computing the best
 * bounding element - adapt as needed */
const BOUNDING_ELEMENT_MAX_OFFSET = 10;

/* Recursively get the top-most "bounding" element
 * for an input element : each parent must only
 * contain a single child or have all its children
 * overlap to be considered a correct bounding candidate */
export const findBoundingInputElement = (el: HTMLElement): HTMLElement => {
    /* special case when an input is wrapped in its label :
     * often the label can be considered the container if
     * all children overlap and has a border width */
    const label = el.closest('label');

    if (label) {
        const labelStyles = getComputedStyle(label);
        const border = parseFloat(labelStyles.getPropertyValue('border-bottom-width'));
        const labelChildrenOverlap =
            label?.childElementCount === 1 && allChildrenOverlap(label, BOUNDING_ELEMENT_MAX_OFFSET);

        if (labelChildrenOverlap && border > 0) return label;
    }

    const parent = el.parentElement!;

    const hasTextNode = containsTextNode(parent);
    const hasOneChild = parent.childElementCount === 1;
    const childrenOverlap = allChildrenOverlap(parent, BOUNDING_ELEMENT_MAX_OFFSET);
    const mb = pixelParser(getComputedStyle(parent).marginBottom);
    const mt = pixelParser(getComputedStyle(parent).marginTop);
    const parentHasMargin = mb !== 0 || mt !== 0;

    if (!hasTextNode && (hasOneChild || childrenOverlap)) {
        /* if parent has margin break from recursion to avoid
         * resolving a bounding box that would not contain the
         * necessary styles information to account for the offsets */
        return parentHasMargin ? parent : findBoundingInputElement(parent);
    }

    return el;
};

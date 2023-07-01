import { pixelParser } from './computed-styles';
import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() !== '');

/* heuristic value for computing the best
 * bounding element - adapt as needed */
const BOUNDING_ELEMENT_MAX_OFFSET = 10;
const INVALID_BOUNDING_TAGS = ['TD', 'TR'];

/* Recursively get the top-most "bounding" element
 * for an input element : each parent must only
 * contain a single child or have all its children
 * overlap to be considered a correct bounding candidate */
export const findBoundingInputElement = (el: HTMLElement, minHeight?: number): HTMLElement => {
    /* bounding element must be at least the size of the input
     * element we're trying to bound - it can happen that a parent
     * container is actually smaller then the nested target */
    const minHeightRef = minHeight ?? el.getBoundingClientRect().height;

    /* special case when an input is wrapped in its label :
     * often the label can be considered the container if
     * all children overlap and current element is not bordered */
    if (el instanceof HTMLInputElement) {
        const isBorderedEl = pixelParser(getComputedStyle(el).borderBottomWidth) !== 0;
        const label = isBorderedEl ? null : el.closest('label');

        if (label) {
            const labelHeightCheck = label.getBoundingClientRect().height >= minHeightRef;
            const labelChildrenOverlap = allChildrenOverlap(label, BOUNDING_ELEMENT_MAX_OFFSET);
            if (labelHeightCheck && labelChildrenOverlap) return label;
        }
    }

    const mb = pixelParser(getComputedStyle(el).marginBottom);
    const mt = pixelParser(getComputedStyle(el).marginTop);

    if (mb !== 0 || mt !== 0) return el;

    const parent = el.parentElement!;

    /* early return if the parent element should not even
     * be considered as a possible candidate. This is especially
     * the case with table row/column elements */
    if (INVALID_BOUNDING_TAGS.includes(parent.tagName)) return el;

    const parentHeight = parent.getBoundingClientRect().height;
    const hasTextNode = containsTextNode(parent);
    const hasOneChild = parent.childElementCount === 1;
    const childrenOverlap = allChildrenOverlap(parent, BOUNDING_ELEMENT_MAX_OFFSET);

    if (parentHeight > 0 && parentHeight >= minHeightRef && !hasTextNode && (hasOneChild || childrenOverlap)) {
        /* if parent has margin break from recursion to avoid
         * resolving a bounding box that would not contain the
         * necessary styles information to account for the offsets */
        return findBoundingInputElement(parent, minHeight);
    }

    return el;
};

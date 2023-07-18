import type { RectOffset } from '../../types/utils/dom';
import { pixelParser } from './computed-styles';
import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() !== '');

/* heuristic value for computing the best
 * bounding element - adapt as needed */
const BOUNDING_ELEMENT_OFFSET: RectOffset = { x: 10, y: 0 };
const BOUNDING_ELEMENT_MAX_WIDTH_RATIO = 1.2;
const INVALID_BOUNDING_TAGS = ['TD', 'TR'];

/* Recursively get the top-most "bounding" element
 * for an input element : each parent must only
 * contain a single child or have all its children
 * overlap to be considered a correct bounding candidate */
export const findBoundingInputElement = (
    curr: HTMLElement,
    options?: {
        input: HTMLInputElement;
        minHeight: number;
        maxWidth: number;
    }
): HTMLElement => {
    /* bounding element must be at least the size of the input
     * element we're trying to bound - it can happen that a parent
     * container is actually smaller then the nested target */
    const optionsRef =
        options ??
        (() => {
            const { height, width } = curr.getBoundingClientRect();
            return {
                input: curr as HTMLInputElement,
                minHeight: height,
                maxWidth: width * BOUNDING_ELEMENT_MAX_WIDTH_RATIO,
            };
        })();

    const { input, minHeight, maxWidth } = optionsRef;
    const isInput = curr === input;

    if (isInput) {
        /* special case when an input is wrapped in its label :
         * often the label can be considered the container if
         * all children overlap and current element is not bordered */
        const inputHasBorder = pixelParser(getComputedStyle(input).borderBottomWidth) !== 0;
        if (inputHasBorder) return input;

        const label = input.closest('label');

        if (label && label.querySelectorAll('input:not([type="hidden"])').length === 1) {
            const labelHeightCheck = label.getBoundingClientRect().height >= minHeight;
            const labelChildrenOverlap = allChildrenOverlap(label, BOUNDING_ELEMENT_OFFSET);
            if (labelHeightCheck && labelChildrenOverlap) return label;
        }
    }

    /* the following padding and margin checks constrain the
     * bounding element not to have any offsets so that we do
     * not lose positioning information when needing to align
     * elements to the input relative to the bounding element
     * By considering the paddings and margins of the element,
     * we aims to select a bounding element that provides the
     * necessary style information that does not introduce any
     * unwanted offsets that could affect the injected icon's
     * positioning */
    if (!isInput) {
        const pb = pixelParser(getComputedStyle(curr).paddingBottom);
        const pt = pixelParser(getComputedStyle(curr).paddingTop);
        if (pb > 1 || pt > 1) return curr;
    }

    const mb = pixelParser(getComputedStyle(curr).marginBottom);
    const mt = pixelParser(getComputedStyle(curr).marginTop);
    if (mb > 1 || mt > 1) return curr;

    const parent = curr.parentElement!;

    /* early return if the parent element should not even
     * be considered as a possible candidate. This is especially
     * the case with table row/column elements */
    if (INVALID_BOUNDING_TAGS.includes(parent.tagName)) return curr;

    const { height: parentHeight, width: parentWidth } = parent.getBoundingClientRect();
    const hasTextNode = containsTextNode(parent);
    const hasOneChild = parent.childElementCount === 1;
    const childrenOverlap = allChildrenOverlap(parent, BOUNDING_ELEMENT_OFFSET);

    if (
        parentHeight > 0 &&
        parentHeight >= minHeight &&
        parentWidth <= maxWidth &&
        !hasTextNode &&
        (hasOneChild || childrenOverlap)
    ) {
        /* if parent has margin break from recursion to avoid
         * resolving a bounding box that would not contain the
         * necessary styles information to account for the offsets */
        return findBoundingInputElement(parent, optionsRef);
    }

    return curr;
};

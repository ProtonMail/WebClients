import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE);

/* heuristic value for computing the best
 * bounding element - adapt as needed */
const BOUNDING_ELEMENT_MAX_OFFSET = 20;

/* Recursively get the top-most "bounding" element
 * for an input element : each parent must only
 * contain a single child or have all its children
 * overlap to be considered a correct bounding candidate */
export const findBoundingElement = (el: HTMLElement): HTMLElement => {
    const parent = el.parentElement;
    return parent &&
        !containsTextNode(parent) &&
        (parent.childElementCount === 1 || allChildrenOverlap(parent, BOUNDING_ELEMENT_MAX_OFFSET))
        ? findBoundingElement(parent)
        : el;
};

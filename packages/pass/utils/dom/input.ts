import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) => [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE);

/**
 * Recursively get the top-most "bounding" element
 * for an input element : each parent must only
 * contain a single child or have all its children
 * overlap to be considered a correct bounding candidate
 */
export const findBoundingElement = (el: HTMLElement): HTMLElement => {
    const parent = el.parentElement;
    return parent && !containsTextNode(parent) && (parent.childElementCount === 1 || allChildrenOverlap(parent))
        ? findBoundingElement(parent)
        : el;
};

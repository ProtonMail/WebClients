import type { RectOffset } from '@proton/pass/types/utils/dom';

import { createStyleCompute, getComputedHeight, pixelParser } from './computed-styles';
import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() !== '');

/* Constants for fine-tuning the bounding element selection algorithm */

const BOUNDING_ELEMENT_OFFSET: RectOffset = { x: 10, y: 0 };
const BOUNDING_ELEMENT_MAX_RATIO = 1.2;
const INVALID_BOUNDING_TAGS = ['TD', 'TR', 'FORM'];

/** Retrieves the child elements of a given element, excluding any injected
 * pass specific elements that could interfer with layout analysis */
const getChildren = (el: Element) => [...el.children].filter((el) => !el.tagName.startsWith('PROTONPASS'));

/** Checks if an element has a visible border or box shadow.
 * Used to identify potential bounding box elements for inputs */
const isBorderedElement = (el: HTMLElement): boolean => {
    const styles = getComputedStyle(el);

    if (styles.boxShadow !== 'none') return true;

    const significantBorders = [
        pixelParser(styles.borderTopWidth),
        pixelParser(styles.borderRightWidth),
        pixelParser(styles.borderBottomWidth),
        pixelParser(styles.borderLeftWidth),
    ].every((width) => width > 0);

    if (significantBorders) {
        return (
            styles.borderTopStyle !== 'none' &&
            styles.borderRightStyle !== 'none' &&
            styles.borderBottomStyle !== 'none' &&
            styles.borderLeftStyle !== 'none'
        );
    }

    return false;
};

/** Recursively finds the optimal bounding element for an input element.
 * This function traverses up the DOM tree to find the most appropriate
 * container for positioning injected UI page-elements.
 *
 * The ideal bounding element should:
 * 1. Closely wrap the input element without excessive padding or margins
 * 2. Not introduce positioning offsets that could affect UI element placement
 * 3. Be large enough to contain the input but not excessively larger
 * 4. Not be a table-related element (TD, TR) or a form element */
export const findBoundingInputElement = (
    curr: HTMLElement,
    constraints?: {
        input: HTMLInputElement;
        minHeight: number;
        maxWidth: number;
    }
): HTMLElement => {
    constraints =
        constraints ??
        (() => {
            /** Initialize constraints from the starting node.
             * Serves as reference for subsequent heuristic checks */
            const { height, width } = curr.getBoundingClientRect();
            return {
                input: curr as HTMLInputElement,
                minHeight: height,
                maxWidth: width * BOUNDING_ELEMENT_MAX_RATIO,
            };
        })();

    const { input, minHeight, maxWidth } = constraints;
    const isInput = curr === input;

    if (isInput) {
        /** Case 1: Input has a bottom border. Likely the best
         * bounding candidate as it's visually "boxed"  */
        const inputHasBorder = pixelParser(getComputedStyle(input).borderBottomWidth) !== 0;
        if (inputHasBorder) return input;

        /** Case 2: Input wrapped in a label. If it's the only input
         * and fits size criteria, use label as bounding element */
        const label = input.closest('label');

        if (label && label.querySelectorAll('input:not([type="hidden"])').length === 1) {
            const labelHeightCheck = label.getBoundingClientRect().height >= minHeight;
            const labelChildrenOverlap = allChildrenOverlap(getChildren(label), BOUNDING_ELEMENT_OFFSET);
            if (labelHeightCheck && labelChildrenOverlap) return label;
        }
    }

    /** Check for significant padding/margins that could affect positioning.
     * Large offsets can interfere with accurate placement of injected UI
     * elements relative to the input field. We aim to preserve precise
     * positioning information.
     *
     * Note: We tolerate padding on the initial input element itself, as
     * inputs often have padding for text alignment. For parent elements,
     * any padding could lead to misalignment of injected elements.. */
    const currStyles = getComputedStyle(curr);

    if (!isInput) {
        const pb = pixelParser(currStyles.paddingBottom);
        const pt = pixelParser(currStyles.paddingTop);
        if (pb > 1 || pt > 1) return curr;
    }

    const mb = pixelParser(currStyles.marginBottom);
    const mt = pixelParser(currStyles.marginTop);
    if (mb > 1 || mt > 1) return curr;

    /* Analyze the parent element next */
    const parent = curr.parentElement!;

    /* Exclude unsuitable elements (e.g., table-related, forms) */
    if (INVALID_BOUNDING_TAGS.includes(parent.tagName)) return curr;

    /* Ensure parent dimensions meet criteria */
    const { height: parentHeight, width: parentWidth } = parent.getBoundingClientRect();
    if (!parentHeight || parentHeight < minHeight || parentWidth > maxWidth) return curr;

    /* Avoid parents with non-empty text nodes (may affect layout) */
    if (containsTextNode(parent)) return curr;

    /* If the parent is fully bordered consider it to be the bounding box */
    if (isBorderedElement(parent)) return parent;

    /* If a parent is much taller than its child, stop.
     * Indicates container size affected by CSS (float, flexbox) */
    const styles = createStyleCompute(parent);
    const parentInnerHeight = getComputedHeight(styles, { mode: 'inner', node: parent });
    if (!isInput && parentInnerHeight.value > curr.offsetHeight * BOUNDING_ELEMENT_MAX_RATIO) return curr;

    /* Check for single child, excluding injected elements */
    const children = getChildren(parent);
    if (children.length === 1) return findBoundingInputElement(parent, constraints);

    /* If all children overlap, parent might be suitable  */
    const childrenOverlap = allChildrenOverlap(children, BOUNDING_ELEMENT_OFFSET);
    if (childrenOverlap) return findBoundingInputElement(parent, constraints);

    return curr;
};

export const autofocusInput = (name: string) =>
    setTimeout(() => {
        document.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.focus({
            /** explicitly setting it although it's the default value.
             * To properly account for sticky headers, use `scroll-margin-top` */
            preventScroll: false,
        });
    }, 15);

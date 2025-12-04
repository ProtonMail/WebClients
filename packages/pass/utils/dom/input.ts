import type { RectOffset } from '@proton/pass/types/utils/dom';

import { createStyleParser, getComputedHeight, pixelParser } from './computed-styles';
import { allChildrenOverlap } from './overlap';

const containsTextNode = (el: HTMLElement) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim() !== '') ||
    el.querySelector('[role="alert"]') !== null;

/* Constants for fine-tuning the bounding element selection algorithm */

const BOUNDING_ELEMENT_OFFSET: RectOffset = { x: 10, y: 0 };
const BOUNDING_ELEMENT_MAX_RATIO = 1.25;
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

type Constraints = {
    input: HTMLInputElement;
    minHeight: number;
    maxWidth: number;
    layoutShift: boolean;
};

/** Checks if current element has acceptable margins for continued DOM traversal.
 * Elements with significant margins create positioning complexity that interferes
 * with accurate UI element placement calculations.  */
const isSuitableCandidate = (element: HTMLElement, _: Constraints) => {
    const currentStyles = getComputedStyle(element);
    const mb = pixelParser(currentStyles.marginBottom);
    const mt = pixelParser(currentStyles.marginTop);

    if (mb > 1 || mt > 1) return false;

    return true;
};

/** Determines if we can safely traverse from current element to its parent
 * during bounding box search. This function acts as a filter in the DOM traversal
 * process - we're trying to find the optimal container element to use as a bounding
 * box for positioning injected UI elements relative to input fields. It must :
 * - Tightly wrap the input without excessive spacing/padding
 * - Not introduce positioning complexity or layout interference
 * - Have predictable dimensions for reliable positioning calculations */
const isSuitableParent = (
    element: HTMLElement,
    constraints: Constraints
): element is HTMLElement & { parentElement: HTMLElement } => {
    const isInput = element === constraints.input;
    const parent = element.parentElement;

    /** DOM boundary hit - nowhere left to go,
     * Cannot traverse further up the DOM tree */
    if (!parent || parent === document.body) return false;

    /* Exclude unsuitable elements (e.g., table-related, forms) */
    if (INVALID_BOUNDING_TAGS.includes(parent.tagName)) return false;

    /** Parent dimensions don't meet size constraints for viable
     * bounding box. Parent must be visible and reasonably sized
     * relative to input for accurate positioning */
    const { height: parentHeight, width: parentWidth } = parent.getBoundingClientRect();
    const { minHeight, maxWidth } = constraints;
    if (!parentHeight || parentHeight < minHeight || parentWidth > maxWidth) return false;

    /** Parent contains text nodes or alert elements that affect layout and
     * may introduce unpredictable spacing affecting positioning. */
    if (containsTextNode(parent)) return false;

    const parentStyles = createStyleParser(parent);
    const pb = parentStyles('padding-bottom', pixelParser);
    const pt = parentStyles('padding-top', pixelParser);

    /** Handle parent elements with padding (tolerance: one level only)
     * One level of padding is manageable for positioning, multiple nested
     * padded containers create cumulative offset complexity. */
    if (pb > 1 || pt > 1) {
        if (!constraints.layoutShift) constraints.layoutShift = true;
        else return false;
    }

    /** Parent significantly taller than child (only applies to non-input elements)
     * Large height discrepancy suggests either a CSS layout complexity (flexbox stretch,
     * grid areas, absolute positioning) and/or a parent container too loosely coupled to
     * input dimensions. Both scenarios make the parent unsuitable. */
    if (!isInput) {
        const parentInnerHeight = getComputedHeight(parentStyles, 'inner');
        if (parentInnerHeight.value > element.offsetHeight * BOUNDING_ELEMENT_MAX_RATIO) return false;
    }

    return true;
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
export const findInputBoundingElement = (curr: HTMLElement, constraints?: Constraints): HTMLElement => {
    constraints =
        constraints ??
        (() => {
            /** Initialize constraints from the starting node.
             * Serves as reference for subsequent heuristic checks */
            const { height, width } = curr.getBoundingClientRect();
            return {
                input: curr as HTMLInputElement,
                layoutShift: false,
                minHeight: height,
                maxWidth: width * BOUNDING_ELEMENT_MAX_RATIO,
            };
        })();

    const { input } = constraints;
    const isInput = curr === input;

    if (isInput) {
        /** Early quick-checks for best-case scenarios */
        const inputStyles = getComputedStyle(curr);
        const pb = pixelParser(inputStyles.paddingBottom);
        const pt = pixelParser(inputStyles.paddingTop);
        const py = pb + pt;

        if (py > 0) {
            constraints.layoutShift = true;
            constraints.minHeight -= py;
        }

        /** Case 1: Input has visible border - optimal bounding candidate :
         * Bordered inputs are visually "boxed" and provide a clear reference */
        const inputHasBorder = pixelParser(getComputedStyle(input).borderBottomWidth) !== 0;
        if (inputHasBorder) return input;

        /** Case 2: Input wrapped in suitable label element. Labels containing one
         * visible input and meeting criterias are good bounding candidates.
         * Suitable if: adequate height + overlapping children + no text nodes */
        const label = input.closest('label');

        if (label && label.querySelectorAll('input:not([type="hidden"])').length === 1) {
            const labelHeightCheck = label.getBoundingClientRect().height >= constraints.minHeight;
            const labelChildrenOverlap = allChildrenOverlap(getChildren(label), BOUNDING_ELEMENT_OFFSET);
            if (labelHeightCheck && labelChildrenOverlap && !containsTextNode(label)) return label;
        }
    }

    if (!isSuitableCandidate(curr, constraints)) return curr;
    if (!isSuitableParent(curr, constraints)) return curr;

    const parent = curr.parentElement;

    /** Fully bordered parent: excellent bounding candidate.
     * Parents with complete borders provide clear visual boundaries */
    if (isBorderedElement(parent)) return parent;

    /* Single child scenario - When parent has only one child,
     * it's probably a container that closely wraps the input */
    const children = getChildren(parent);
    if (children.length === 1) return findInputBoundingElement(parent, constraints);

    /* All children overlap spatially:  parent is likely a tight layout container */
    const childrenOverlap = allChildrenOverlap(children, BOUNDING_ELEMENT_OFFSET);
    if (childrenOverlap) return findInputBoundingElement(parent, constraints);

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

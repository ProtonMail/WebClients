import { invert } from '../fp/predicates';

type StackResult =
    | [true, number] /* Represents a stacking context with a z-index value */
    | [false, null] /* Indicates that there is no stacking context or no z-index value */;

/* This function provides a minimal version of stacking context detection.
 * check MDN documentation for missing cases in case they become relevant :
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context */
export const isStackingContext = (el: HTMLElement): StackResult => {
    const parent = el.parentElement;
    const styles = getComputedStyle(el);
    const value = parseInt(styles.zIndex, 10);

    if (isNaN(value)) return [false, null];

    const elementStack =
        !parent ||
        styles.position !== 'static' ||
        styles.containerType === 'size' ||
        styles.containerType === 'inline-size';

    if (elementStack) return [true, value];

    const parentStyles = getComputedStyle(parent);
    const childStack = parentStyles.display === 'flex' || parentStyles.display === 'grid';

    if (childStack) return [true, value];

    return [false, null];
};

/* Recursively determines the maximum z-index value required for overlaying
 * a direct root child element & over the specified element. During traversal,
 * z-index evaluation occurs only if the current element is a valid stacking
 * context */
export const zTraverse = (el: HTMLElement, max: number = 0): number => {
    const [isStack, zIndex] = isStackingContext(el);
    const nextMax = isStack ? zIndex : max;
    const parent = el.parentElement;

    return parent ? zTraverse(parent, nextMax) : max;
};

/* Gets the maximum z-index value for an HTML element and its descendants */
export const getMaxZIndex = (start: HTMLElement) => {
    const children = start.querySelectorAll('*');
    const childZIndexes = Array.from(children, (el) => parseInt(getComputedStyle(el).zIndex, 10));

    return Math.max(zTraverse(start), ...childZIndexes.filter(invert(Number.isNaN)));
};

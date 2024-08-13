import type { MaybeNull } from '@proton/pass/types';

type StackResult =
    | [true, number] /* Represents a stacking context with a z-index value */
    | [false, null] /* Indicates that there is no stacking context or no z-index value */;

/* This function provides a minimal version of stacking context detection.
 * check MDN documentation for missing cases in case they become relevant :
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context */
export const isStackingContext = (el: HTMLElement): StackResult => {
    const parent = el.parentElement;

    const { zIndex, position, containerType } = getComputedStyle(el);
    const parsedZIndex = parseInt(zIndex, 10);
    const value = isNaN(parsedZIndex) ? 0 : parsedZIndex;
    const hasZIndex = zIndex !== '' && zIndex !== 'auto';

    if (
        /* Root element of the document */
        parent === null ||
        /* Element with a position value absolute or
         * relative and z-index value other than auto */
        (hasZIndex && (position === 'absolute' || position === 'relative')) ||
        /* Element with a position value fixed or sticky */
        position === 'fixed' ||
        position === 'sticky' ||
        /* Element with a container-type value `size`
         * or `inline-size` set */
        containerType === 'size' ||
        containerType === 'inline-size'
    ) {
        return [true, value];
    }

    /* Element that is a child of a flex/grid container,
     * with z-index value other than auto */
    const { display } = getComputedStyle(parent);
    if (hasZIndex && (display === 'flex' || display === 'grid')) return [true, value];

    return [false, null];
};

/* Recursively determines the maximum z-index value required for overlaying
 * a direct root child element & over the specified element. During traversal,
 * z-index evaluation occurs only if the current element is a valid stacking
 * context */
export const resolveClosestStackZIndex = (el: HTMLElement, cache?: WeakMap<HTMLElement, MaybeNull<number>>): number => {
    const parent = el.parentElement;

    if (cache?.has(el)) {
        const seen = cache.get(el)!;
        if (seen !== null) return seen;
        if (seen === null && parent) return resolveClosestStackZIndex(parent, cache);
    }

    const [stack, zIndex] = isStackingContext(el);
    cache?.set(el, stack ? zIndex : null);

    if (stack) return zIndex;
    return parent ? resolveClosestStackZIndex(parent, cache) : 0;
};

/* Gets the maximum z-index value for an HTML element and its descendants */
export const getMaxZIndex = (anchors: HTMLElement[]) => {
    let cache: MaybeNull<WeakMap<HTMLElement, MaybeNull<number>>> = anchors.length > 1 ? new WeakMap() : null;
    const max = Math.max(...anchors.map((el) => resolveClosestStackZIndex(el, cache!)));
    cache = null;

    return max;
};

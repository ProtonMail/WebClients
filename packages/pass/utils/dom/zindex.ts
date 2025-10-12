import type { MaybeNull } from '@proton/pass/types';

export const getZIndex = (el: HTMLElement, styles?: CSSStyleDeclaration): number => {
    const { zIndex } = styles ?? getComputedStyle(el);
    const parsedZIndex = parseInt(zIndex, 10);
    return isNaN(parsedZIndex) ? 0 : parsedZIndex;
};

type StackResult = [stacking: boolean, zIndex: number];

/* This function provides a minimal version of stacking context detection.
 * check MDN documentation for missing cases in case they become relevant :
 * https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context */
export const isStackingContext = (el: HTMLElement): StackResult => {
    const parent = el.parentElement;
    const styles = getComputedStyle(el);
    const { zIndex, position, containerType } = getComputedStyle(el);
    const value = getZIndex(el, styles);
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

    return [false, value];
};

/** Calculates the minimum z-index needed for an overlay to appear above target elements.
 * Designed for injecting overlay elements as direct children of the supplied container.
 * Walks up DOM from each target to container boundary:
 * - Non-stacking contexts: accumulates z-index values (Math.max)
 * - Stacking contexts: resets to context's z-index for atomic layering
 * - Returns maximum across all target elements
 *
 * Elements within a stacking context are stacked independently from elements outside
 * of that stacking context." When we hit a stacking context, we reset because its z-index
 * determines where the entire context is positioned. */
export const getOverlayZIndex = (els: HTMLElement[], container: HTMLElement) => {
    let cache: MaybeNull<WeakMap<HTMLElement, StackResult>> = new WeakMap();

    const maxs = els.map((el) => {
        let maxZIndex = getZIndex(el);
        let current = el.parentElement;

        while (current && current !== container) {
            const result = cache?.get(current) ?? isStackingContext(current);
            const [stacking, zIndex] = result;

            if (stacking) maxZIndex = zIndex;
            else maxZIndex = Math.max(maxZIndex, zIndex);

            cache?.set(current, result);
            current = current.parentElement;
        }

        return maxZIndex;
    });

    cache = null;

    return Math.max(0, ...maxs);
};

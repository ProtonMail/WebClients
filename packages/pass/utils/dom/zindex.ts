/* recursively resolves the z-index postitioning of an element
 * by walking up the parents and checking for a valid z-index
 * value. When we get the first match, as a heuristic, keep on
 * walking up and resolve the maximum value */
export const inferZIndexFromParent = (el: HTMLElement, returnEarly: boolean = false): number => {
    const parent = el.parentElement;
    if (!parent) return 0;

    const zIndex = window.getComputedStyle(parent).getPropertyValue('z-index');
    const value = parseInt(zIndex, 10);

    if (isNaN(value)) return inferZIndexFromParent(parent, returnEarly);
    return returnEarly ? value : Math.max(inferZIndexFromParent(parent, true));
};

export const getMaxZIndex = (rootElement: HTMLElement) => {
    return Math.max(
        inferZIndexFromParent(rootElement),
        ...Array.from(rootElement.querySelectorAll('*'), (el) =>
            parseInt(window.getComputedStyle(el).zIndex, 10)
        ).filter((zIndex) => !Number.isNaN(zIndex)),
        0
    );
};

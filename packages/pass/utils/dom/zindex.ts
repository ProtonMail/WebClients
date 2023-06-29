const zTraverse = (el: HTMLElement, max: number = 0): number => {
    const styles = getComputedStyle(el);
    const { position, zIndex } = styles;

    const parent = el.parentElement;
    if (!parent) return max;

    if (position !== 'static') {
        const value = parseInt(zIndex, 10);
        if (!isNaN(value)) return zTraverse(parent, Math.max(value, max));
    }

    return zTraverse(parent, max);
};

export const getMaxZIndex = (rootElement: HTMLElement) => {
    const zChildren = Array.from(rootElement.querySelectorAll('*'), (el) =>
        parseInt(window.getComputedStyle(el).zIndex, 10)
    ).filter((zIndex) => !Number.isNaN(zIndex));

    return Math.max(zTraverse(rootElement), ...zChildren);
};

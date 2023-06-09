type Rect = { left: number; right: number; top: number; bottom: number };
const rectOverlap = (from: Rect, to: Rect, offset: number = 0): boolean =>
    !(
        from.right - offset < to.left ||
        from.left + offset > to.right ||
        from.bottom - offset < to.top ||
        from.top + offset > to.bottom
    );

export const allChildrenOverlap = (el: HTMLElement, maxOffset: number): boolean => {
    const siblings = [...el.children] as HTMLElement[];

    if (siblings.length <= 1) {
        return true;
    }
    const [head, ...rest] = siblings;

    return rest.reduce<[boolean, Rect]>(
        ([all, rect], node) => {
            const nodeRect = node.getBoundingClientRect();
            const hidden = nodeRect.height === 0 && nodeRect.width === 0;
            const overlap = hidden || rectOverlap(nodeRect, rect, maxOffset);

            return [
                all && overlap,
                {
                    top: Math.min(rect.top, nodeRect.top),
                    right: Math.min(rect.right, nodeRect.right),
                    bottom: Math.max(rect.bottom, nodeRect.bottom),
                    left: Math.max(rect.left, nodeRect.left),
                },
            ];
        },
        [true, head.getBoundingClientRect()]
    )[0];
};

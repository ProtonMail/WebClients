import type { Rect, RectOffset } from '../../types/utils/dom';

const rectOffset = (rect: Rect, offset: RectOffset): Rect => ({
    top: rect.top - offset.y,
    right: rect.right + offset.x,
    bottom: rect.bottom + offset.y,
    left: rect.left - offset.x,
});

const rectOverlap = (rectA: Rect, rectB: Rect, offset: RectOffset = { x: 0, y: 0 }): boolean => {
    const a = rectOffset(rectA, offset);
    const b = rectOffset(rectB, offset);
    const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

    return xOverlap > 0 && yOverlap > 0;
};
export const allChildrenOverlap = (el: HTMLElement, offset: RectOffset): boolean => {
    const siblings = ([...el.children] as HTMLElement[])
        .map((el) => el.getBoundingClientRect())
        .filter(({ height, width }) => height > 0 && width > 0);

    if (siblings.length <= 1) return true;
    const [head, ...rest] = siblings;

    return rest.reduce<[boolean, Rect]>(
        ([all, rect], nodeRect) => {
            const hidden = nodeRect.height === 0 && nodeRect.width === 0;
            const overlap = hidden || rectOverlap(nodeRect, rect, offset);

            return [
                all && overlap,
                {
                    top: Math.min(rect.top, nodeRect.top),
                    right: Math.max(rect.right, nodeRect.right),
                    bottom: Math.max(rect.bottom, nodeRect.bottom),
                    left: Math.min(rect.left, nodeRect.left),
                },
            ];
        },
        [true, head]
    )[0];
};

import type { MaybeNull } from '@proton/pass/types';
import type { Rect, RectOffset } from '@proton/pass/types/utils/dom';

const rectOffset = (rect: Rect, offset: RectOffset): Rect => ({
    top: rect.top - offset.y,
    right: rect.right + offset.x,
    bottom: rect.bottom + offset.y,
    left: rect.left - offset.x,
});

const rectOverlap = (a: Rect, b: Rect): boolean => {
    const xOverlap = Math.max(0, Math.floor(Math.min(a.right, b.right) - Math.max(a.left, b.left)));
    const yOverlap = Math.max(0, Math.floor(Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)));

    return xOverlap > 0 && yOverlap > 0;
};

/** Checks if all child elements overlap within a combined bounding rectangle.
 * This function iterates through the provided child elements, calculating their
 * bounding rectangles with an applied offset. It then checks if each child's
 * rectangle overlaps with a progressively expanding combined rectangle of all
 * previous children. The purpose is to determine if all children form a contiguous
 * area for identifying cohesive UI components or form fields. */
export const allChildrenOverlap = (children: Element[], offset: RectOffset): boolean =>
    children.reduce<[boolean, MaybeNull<Rect>]>(
        ([allOverlap, combinedRect], child) => {
            if (!allOverlap) return [allOverlap, combinedRect];

            const boundingRect = child.getBoundingClientRect();
            const { height, width } = boundingRect;

            /* Skip elements with zero height or width */
            if (height <= 0 || width <= 0) return [allOverlap, combinedRect];

            const rect = rectOffset(boundingRect, offset);

            /* If this is the first valid Rect, use as initial */
            if (combinedRect === null) return [true, rect];

            return [
                allOverlap && rectOverlap(rect, combinedRect),
                {
                    top: Math.floor(Math.min(combinedRect.top, rect.top)),
                    right: Math.floor(Math.max(combinedRect.right, rect.right)),
                    bottom: Math.floor(Math.max(combinedRect.bottom, rect.bottom)),
                    left: Math.floor(Math.min(combinedRect.left, rect.left)),
                },
            ];
        },
        [true, null]
    )[0];

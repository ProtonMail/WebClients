import { useMemo } from 'react';
import { useElementRect } from 'react-components';

const usePopoverPlacement = (ref, style, layout) => {
    const elementRect = useElementRect(ref);

    return useMemo(() => {
        const { top: topCoordinate, left: leftCoordinate } = style;
        if (!elementRect || !layout) {
            return {
                top: topCoordinate,
                left: leftCoordinate
            };
        }

        const {
            rect: { height: containerHeight, width: containerWidth },
            eventWidth = 0
        } = layout;
        const { width: elementWidth, height: elementHeight } = elementRect;

        const diffOverflowY = topCoordinate + elementHeight - containerHeight;
        const top = diffOverflowY >= 0 ? topCoordinate - diffOverflowY : topCoordinate;

        const left = (() => {
            // First move it to the left of the element
            const leftPlacement1 = leftCoordinate - elementWidth;
            if (leftPlacement1 >= 0) {
                return leftPlacement1;
            }

            // Then try to the right of the element
            const leftPlacement2 = leftCoordinate + eventWidth;
            // Push it back if it's still too large.
            const diffOverFlowX = leftPlacement2 + elementWidth - containerWidth;
            return diffOverFlowX >= 0 ? leftPlacement2 - diffOverFlowX : leftPlacement2;
        })();

        return {
            top,
            left
        };
    }, [style, layout, elementRect]);
};

export default usePopoverPlacement;

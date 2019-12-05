import { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import { useRect } from '../../hooks/useRect';

const Popover = ({
    targetRef,
    containerRef,
    children,
    isOpen,
    once = false,
    when
}) => {
    const [popoverRef, setPopoverRef] = useState();

    const containerRect = useRect(containerRef, isOpen);
    const targetRect = useRect(targetRef, isOpen, once, useMemo(() => [when, containerRect], [when, containerRect]));
    const popoverRect = useRect(popoverRef, isOpen);

    const value = useMemo(() => {
        if (!containerRef || !containerRect) {
            return;
        }

        const { width: containerWidth, height: containerHeight } = containerRect;
        const { width: popoverWidth, height: popoverHeight } = popoverRect || { width: 0, height: 0 };

        const alignCenterStyle = (() => {
            const top = containerHeight / 2 - popoverHeight / 2 ;
            const left = containerWidth / 2 - popoverWidth / 2;

            return {
                top,
                left
            };
        });

        const alignTargetStyle = (({ left: targetLeft, top: targetTop, width: targetWidth }) => {
            const diffOverflowY = targetTop + popoverHeight - containerHeight;

            const top = diffOverflowY >= 0 ? targetTop - diffOverflowY : Math.max(targetTop, 0);

            const left = (() => {
                // First move it to the left of the element
                const leftPlacement1 = targetLeft - popoverWidth;
                if (leftPlacement1 >= 0) {
                    return leftPlacement1;
                }

                // Then try to the right of the element
                const leftPlacement2 = targetLeft + targetWidth;
                // Push it back if it's still too large.
                const diffOverFlowX = leftPlacement2 + popoverWidth - containerWidth;
                return diffOverFlowX >= 0 ? leftPlacement2 - diffOverFlowX : leftPlacement2;
            })();

            return {
                top,
                left
            };
        });

        const style = (() => {
            if (!popoverRect) {
                return {
                    top: -9999,
                    left: -9999
                };
            }
            if (targetRect && targetRef) {
                return alignTargetStyle(targetRect);
            }
            return alignCenterStyle();
        })();

        return {
            ref: setPopoverRef,
            style: {
                top: Math.round(style.top),
                left: Math.round(style.left),
            }
        };
    }, [popoverRef, targetRef, containerRef, containerRect, popoverRect, targetRect]);

    return value && isOpen ? ReactDOM.createPortal(children(value), containerRef) : null;
};

export default Popover;

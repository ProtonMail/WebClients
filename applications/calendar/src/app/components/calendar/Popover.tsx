import { useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import { Rect } from '../../hooks/observeRect';
import { useRect } from '../../hooks/useRect';

export interface PopoverRenderData {
    ref: (el: HTMLElement | null) => void;
    style: { left: number; top: number };
}

interface Props {
    targetEl: HTMLElement | null;
    containerEl: HTMLElement | null;
    children: (data: PopoverRenderData) => JSX.Element | null;
    isOpen: boolean;
    once: boolean;
    when?: any;
}
const Popover = ({ targetEl, containerEl, children, isOpen, once = false, when }: Props) => {
    const [popoverEl, setPopoverEl] = useState<HTMLElement | null>(null);

    const containerRect = useRect(containerEl, isOpen);
    const targetRect = useRect(
        targetEl,
        isOpen,
        once,
        useMemo(() => [when, containerRect], [when, containerRect])
    );
    const popoverRect = useRect(popoverEl, isOpen);

    const value = useMemo(() => {
        if (!containerEl || !containerRect) {
            return;
        }

        const { width: containerWidth, height: containerHeight } = containerRect;
        const { width: popoverWidth, height: popoverHeight } = popoverRect || { width: 0, height: 0 };

        const alignCenterStyle = () => {
            const top = containerHeight / 2 - popoverHeight / 2;
            const left = containerWidth / 2 - popoverWidth / 2;

            return {
                top,
                left,
            };
        };

        const alignTargetStyle = ({ left: targetLeft, top: targetTop, width: targetWidth }: Rect) => {
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
                left,
            };
        };

        const style = (() => {
            if (!popoverRect) {
                return {
                    top: -9999,
                    left: -9999,
                };
            }
            if (targetRect && targetEl) {
                return alignTargetStyle(targetRect);
            }
            return alignCenterStyle();
        })();

        return {
            ref: setPopoverEl,
            style: {
                top: Math.round(style.top),
                left: Math.round(style.left),
            },
        };
    }, [popoverEl, targetEl, containerEl, containerRect, popoverRect, targetRect]);

    if (value && containerEl && isOpen) {
        return <>{ReactDOM.createPortal(children(value), containerEl)}</>;
    }

    return null;
};

export default Popover;

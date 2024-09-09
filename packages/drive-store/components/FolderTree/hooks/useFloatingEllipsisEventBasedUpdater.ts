import type React from 'react';
import { useContext, useEffect } from 'react';

import { FloatingEllipsisContext } from '../FloatingEllipsisContext';
import type { FloatingEllipsisContextValue, FloatingEllipsisEventType } from './useFloatingEllipsisContext';

const VISIBILITY_CLASS = 'floating-ellipsis-hidden';

export const useFloatingEllipsisEventBasedUpdater = ({
    visibilityControlRef,
    elem,
}: {
    visibilityControlRef: React.RefObject<HTMLDivElement>;
    elem: React.RefObject<HTMLDivElement>;
}): (() => void) => {
    const { events, getDimensions } = useContext<FloatingEllipsisContextValue>(FloatingEllipsisContext);

    const updateVisibility = () => {
        if (!elem.current) {
            return;
        }
        const { scrollWidth, scrollLeft } = getDimensions();

        if (!visibilityControlRef.current) {
            return;
        }
        const rightEnd = visibilityControlRef.current.offsetLeft + visibilityControlRef.current.offsetWidth;
        const elemWidth = elem.current?.offsetWidth || 0;
        const visible = rightEnd > scrollWidth + scrollLeft;
        if (visible) {
            elem.current.style.left = `${scrollWidth + scrollLeft - elemWidth}px`;
            elem.current.classList.remove(VISIBILITY_CLASS);
        } else {
            elem.current.classList.add(VISIBILITY_CLASS);
        }
    };

    useEffect(() => {
        const eventTypes: FloatingEllipsisEventType[] = ['resize', 'scroll'];
        eventTypes.forEach((eventType) => events.addEventListener(eventType, updateVisibility));
        return () => {
            eventTypes.forEach((eventType) => events.removeEventListener(eventType, updateVisibility));
        };
    }, [events]);

    return updateVisibility;
};

export default useFloatingEllipsisEventBasedUpdater;

import type { RefObject } from 'react';
import { useEffect, useState } from 'react';

export type FloatingEllipsisEventType = 'resize' | 'scroll';

export interface FloatingEllipsisContextValue {
    events: EventTarget;
    getDimensions: () => FloatingEllipsisContainerDimensions;
}

export interface FloatingEllipsisContainerDimensions {
    scrollWidth: number;
    scrollLeft: number;
}

export const useFloatingEllipsisContext = ({
    containerRef,
    resizableRef,
}: {
    containerRef: RefObject<HTMLDivElement>;
    resizableRef?: RefObject<HTMLElement>;
}): FloatingEllipsisContextValue => {
    const [events] = useState<EventTarget>(new EventTarget());
    const getDimensions = (): FloatingEllipsisContainerDimensions => ({
        scrollWidth: containerRef.current?.clientWidth ?? 0,
        scrollLeft: containerRef.current?.scrollLeft ?? 0,
    });
    const [context] = useState<FloatingEllipsisContextValue>({
        events,
        getDimensions,
    });

    const triggerScroll = () => events.dispatchEvent(new Event('scroll' as FloatingEllipsisEventType));

    const resizeObserver = new ResizeObserver(() => {
        events.dispatchEvent(new Event('resize' as FloatingEllipsisEventType));
    });

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }
        resizeObserver.observe(containerRef.current);
        containerRef.current.addEventListener('scroll', triggerScroll);

        if (resizableRef?.current) {
            resizeObserver.observe(resizableRef.current);
        }

        return () => {
            if (!containerRef.current) {
                return;
            }
            resizeObserver.disconnect();
            containerRef.current.removeEventListener('scroll', triggerScroll);
        };
    }, []);

    return context;
};

export default useFloatingEllipsisContext;

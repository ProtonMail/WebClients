import { useCallback, useRef, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

export const useMailboxToolbarBreakpoints = () => {
    const observerRef = useRef<ResizeObserver | null>(null);
    const [containerWidth, setContainerWidth] = useState(Infinity);
    const breakpoint = useActiveBreakpoint();

    const ref = useCallback((el: HTMLDivElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        if (el) {
            const observer = new ResizeObserver(([entry]) => {
                setContainerWidth(entry.contentRect.width);
            });
            observer.observe(el);
            observerRef.current = observer;
        } else {
            setContainerWidth(Infinity);
        }
    }, []);

    // Derived breakpoints based on available toolbar width (not viewport width)
    const isTiny = containerWidth < 820;
    const isExtraTiny = containerWidth < 575;
    const filterAsDropdown = containerWidth < 1024;

    const isSmallScreen = breakpoint.viewportWidth['<=small'];

    return { ref, isTiny, isExtraTiny, filterAsDropdown, isSmallScreen };
};

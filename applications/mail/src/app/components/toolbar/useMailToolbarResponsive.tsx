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
    const isSmallScreen = breakpoint.viewportWidth['<=small'];
    const listBreakpoints = {
        isExtraTiny: containerWidth < 500,
        isTiny: containerWidth < 650,
        filterAsDropdown: containerWidth < 1024,
    };

    const headerBreakpoints = {
        isExtraTiny: containerWidth < 375,
        isTiny: containerWidth < 450,
        filterAsDropdown: containerWidth < 1024,
    };

    return { ref, listBreakpoints, headerBreakpoints, isSmallScreen };
};

import { useCallback, useRef, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

export const useMailboxToolbarBreakpoints = (placement: 'list' | 'header') => {
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

    const isExtraTiny = containerWidth < (placement === 'list' ? 500 : 375);
    const isTiny = containerWidth < (placement === 'list' ? 650 : 450);
    const filterAsDropdown = containerWidth < 1024;

    return { ref, isSmallScreen, isExtraTiny, isTiny, filterAsDropdown };
};

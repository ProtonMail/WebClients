import { useLayoutEffect, useRef, useState } from 'react';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

export const useMailboxToolbarBreakpoints = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(Infinity);
    const breakpoint = useActiveBreakpoint();

    useLayoutEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setContainerWidth(entry.contentRect.width);
        });

        observer.observe(el);

        return () => observer.disconnect();
    }, [ref]);

    // Derived breakpoints based on available toolbar width (not viewport width)
    const isTiny = containerWidth < 820;
    const isExtraTiny = containerWidth < 575;
    const filterAsDropdown = containerWidth < 1024;

    const isSmallScreen = breakpoint.viewportWidth['<=small'];

    return { ref, isTiny, isExtraTiny, filterAsDropdown, isSmallScreen };
};

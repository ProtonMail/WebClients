import { RefObject, useEffect, useMemo, useState } from 'react';

export const useElementBreakpoints = (ref: RefObject<HTMLElement>, breakpoints: { [key: string]: number }) => {
    const [breakpoint, setBreakpoint] = useState<string>();

    const orderedBreakpoints = useMemo(() => {
        const entries = Object.entries(breakpoints);
        return entries.sort((a, b) => b[1] - a[1]);
    }, [breakpoints]);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        const observer = new ResizeObserver((entries) => {
            const width = entries[0].contentRect.width;

            const breakpoint = orderedBreakpoints.find((breakpoint) => {
                return breakpoint[1] < width;
            })?.[0];

            setBreakpoint(breakpoint);
        });

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [breakpoints]);

    return breakpoint;
};

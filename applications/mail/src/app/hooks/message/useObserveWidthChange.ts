import { RefObject, useEffect, useMemo, useRef } from 'react';

const useObserveWidthChange = (elRef: RefObject<HTMLElement>, onResizeCallback: () => void) => {
    const prevWidthRef = useRef<number | undefined>(elRef.current?.offsetWidth);
    const observer = useMemo(() => {
        return new ResizeObserver((entries) => {
            const elEntry = entries.find((entry) => entry.target === elRef.current);
            const width = elEntry?.borderBoxSize.map((size) => size.inlineSize)[0];

            if (!width) {
                return;
            }

            const roundedWidth = Math.round(width);
            const hasResized = roundedWidth !== prevWidthRef.current;

            if (hasResized) {
                onResizeCallback();
            }

            prevWidthRef.current = roundedWidth;
        });
    }, [onResizeCallback]);

    useEffect(() => {
        if (!elRef.current) {
            return;
        }

        observer.observe(elRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);
};

export default useObserveWidthChange;

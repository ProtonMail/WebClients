import { type RefObject, useEffect, useState } from 'react';

/** Tracks an element's content-box size via ResizeObserver. */
export const useElementSize = (ref: RefObject<HTMLElement | null>) => {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            if (!entry) {
                return;
            }
            const { width, height } = entry.contentRect;
            setSize({ width, height });
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [ref]);

    return size;
};

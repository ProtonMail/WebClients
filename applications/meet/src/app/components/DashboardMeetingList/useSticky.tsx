import { useCallback, useEffect, useRef, useState } from 'react';

export const useSticky = ({ shouldUseSticky }: { shouldUseSticky: boolean }) => {
    const stickyRef = useRef<HTMLDivElement>(null);
    const previousElementRef = useRef<HTMLDivElement>(null);

    const [isStuck, setIsStuck] = useState(false);
    const stickyObserver = useRef<IntersectionObserver | null>(null);
    const referenceObserver = useRef<IntersectionObserver | null>(null);

    const cleanupSticky = useCallback(() => {
        setIsStuck(false);
        stickyObserver.current?.disconnect();
        referenceObserver.current?.disconnect();
    }, []);

    const initSticky = useCallback(() => {
        cleanupSticky();

        const reference = previousElementRef.current;
        const sticky = stickyRef.current;
        if (!reference || !sticky) {
            return;
        }

        stickyObserver.current = new IntersectionObserver(
            (entries) => {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (entry.target !== sticky || entry.intersectionRatio >= 1) {
                        continue;
                    }
                    // Only stuck when the top of the viewport has passed the top of the element.
                    // If the bottom of the viewport touches the element (entering from below),
                    // boundingClientRect.top is positive, so we must not set isStuck.
                    if (entry.boundingClientRect.top <= 0) {
                        setIsStuck(true);
                    }
                }
            },
            { threshold: [1], rootMargin: '0px 0px 0px 0px' }
        );

        stickyObserver.current.observe(sticky);

        referenceObserver.current = new IntersectionObserver(
            (entries) => {
                for (let i = 0; i < entries.length; i++) {
                    const entry = entries[i];
                    if (entry.target === reference && entry.intersectionRatio > 0) {
                        setIsStuck(false);
                    }
                }
            },
            { threshold: [0.1], rootMargin: '0px 0px 0px 0px' }
        );
        referenceObserver.current.observe(reference);
    }, [cleanupSticky]);

    useEffect(() => {
        if (shouldUseSticky) {
            initSticky();
        } else {
            cleanupSticky();
        }
    }, [cleanupSticky, initSticky, shouldUseSticky]);

    return { isStuck, stickyRef, previousElementRef };
};

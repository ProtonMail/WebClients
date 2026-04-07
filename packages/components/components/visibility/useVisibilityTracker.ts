import { useEffect, useRef } from 'react';

import type { VisibilityThreshold, VisibilityTrackerOptions } from './types';

const THRESHOLD_MAP: Record<VisibilityThreshold, number> = {
    any: 0,
    half: 0.5,
    full: 1,
};

/**
 * Headless hook that tracks visibility for a ref you provide.
 *
 * Callbacks receive a `count` argument — the number of times that event has
 * fired so far.
 * The count is always `1` when `once = true` (default).
 *
 * @example
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useVisibilityTracker(ref, {
 *   once: false,
 *   onEnter: (count) => console.log(`entered ${count} time(s)`),
 * });
 * return <div ref={ref}>…</div>;
 * ```
 */
export function useVisibilityTracker<T extends Element>(
    targetRef: React.RefObject<T>,
    { onEnter, onExit, threshold = 'half', marginAroundTarget, once = true }: VisibilityTrackerOptions = {}
) {
    // Keep latest callbacks in refs so the observer closure never goes stale.
    const onEnterRef = useRef(onEnter);
    const onExitRef = useRef(onExit);

    useEffect(() => {
        onEnterRef.current = onEnter;
    }, [onEnter]);
    useEffect(() => {
        onExitRef.current = onExit;
    }, [onExit]);

    const hasEnteredRef = useRef(false);
    const hasExitedRef = useRef(false);

    const enterCountRef = useRef(0);
    const exitCountRef = useRef(0);

    const numericThreshold = THRESHOLD_MAP[threshold];

    useEffect(() => {
        const target = targetRef.current;
        if (!target) {
            return;
        }

        hasEnteredRef.current = false;
        hasExitedRef.current = false;
        enterCountRef.current = 0;
        exitCountRef.current = 0;

        const handleIntersect: IntersectionObserverCallback = (entries, observer) => {
            for (const entry of entries) {
                const isVisible = entry.isIntersecting;

                if (isVisible) {
                    if (!once || !hasEnteredRef.current) {
                        hasEnteredRef.current = true;
                        enterCountRef.current += 1;
                        onEnterRef.current?.(enterCountRef.current);
                    }
                } else {
                    if (hasEnteredRef.current && (!once || !hasExitedRef.current)) {
                        hasExitedRef.current = true;
                        exitCountRef.current += 1;
                        onExitRef.current?.(exitCountRef.current);
                    }
                }

                // Disconnect after both one-shot callbacks have fired.
                if (once && hasEnteredRef.current && hasExitedRef.current) {
                    observer.unobserve(entry.target);
                }
            }
        };

        const observer = new IntersectionObserver(handleIntersect, {
            threshold: numericThreshold,
            rootMargin: marginAroundTarget,
        });

        observer.observe(target);
        return () => observer.disconnect();
    }, [targetRef, numericThreshold, marginAroundTarget, once]);
}

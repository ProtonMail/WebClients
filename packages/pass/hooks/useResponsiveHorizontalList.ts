import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useStatefulRef } from '@proton/pass/hooks/useStatefulRef';

type UseResponsiveItemsOptions = { gap: number; maxChildWidth: number };

/** Tracks seen visible counts against children width to optimize reconciliation.
 * Monitors previously observed visible counts and ensures they align with constraints.
 * If the container width has not been reached and the current visible count has not been
 * observed, attempts to add a visible item; otherwise, removes one. The process stops early
 * when decreasing to a previously seen visible count. This incremental resolution optimizes
 * the adjustment of the visible item count based on the container dimensions. */
export const useResponsiveHorizontalList = <T>(items: T[], options: UseResponsiveItemsOptions) => {
    const [visibleCount, setVisibleCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const seen = useRef<Map<number, number>>(new Map());
    const max = useStatefulRef<number>(items.length);

    const reconciliate = useCallback(() => {
        if (!ref.current) return;

        const children = Array.from(ref.current?.children ?? []) as HTMLElement[];
        const maxWidth = ref.current?.offsetWidth ?? 0;
        if (maxWidth === 0) return;

        const checkLower = (n: number): number => {
            const widthForCount = seen.current.get(n);
            if (widthForCount === undefined) return n;
            return widthForCount > maxWidth ? checkLower(n - 1) : n;
        };

        const checkUpper = (n: number): number => {
            const widthForCount = seen.current.get(n);
            if (widthForCount === undefined) return n;
            return widthForCount < maxWidth ? checkUpper(n + 1) : n - 1;
        };

        setVisibleCount((currentCount) => {
            const cached = seen.current.get(currentCount);
            const width = cached ?? children.reduce((total, { offsetWidth }) => total + offsetWidth + options.gap, 0);

            /* children may have not rendered yet */
            if (width !== 0) seen.current.set(currentCount, width);

            if (width > maxWidth) return Math.max(0, checkLower(currentCount - 1));
            if (width < maxWidth) return Math.min(max.current, checkUpper(currentCount + 1));

            return currentCount;
        });
    }, []);

    useLayoutEffect(() => {
        setVisibleCount(() => {
            const maxWidth = ref.current?.offsetWidth ?? 0;
            return Math.min(max.current, Math.floor(maxWidth / (options.maxChildWidth + options.gap)));
        });

        window.addEventListener('resize', reconciliate);
        return () => window.removeEventListener('resize', reconciliate);
    }, []);

    useLayoutEffect(() => {
        seen.current.clear();
        reconciliate();
    }, [items]);

    useLayoutEffect(reconciliate, [visibleCount]);

    return useMemo(
        () => ({
            ref,
            visible: items.slice(0, visibleCount),
            hidden: items.slice(visibleCount),
        }),
        [visibleCount, items]
    );
};

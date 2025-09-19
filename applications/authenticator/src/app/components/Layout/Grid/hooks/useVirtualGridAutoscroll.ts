import type { MutableRefObject } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Virtualizer } from '@tanstack/react-virtual';

import type { MaybeNull } from '@proton/pass/types';

const THRESHOLD = 50;
const MAX_SPEED = 20;

/** Auto-scroll for virtual grids during drag operations.
 * DnD doesn't work well with virtual grids because it can
 * mutate `scrollTop` outside of the virtualizer's internal
 * scroll state, causing rendering/collision artifacts */
export const useVirtualGridAutoscroll = (
    active: MaybeNull<string>,
    container: MutableRefObject<MaybeNull<HTMLDivElement>>,
    virtualizer: Virtualizer<HTMLDivElement, Element>
) => {
    const [dragY, setDragY] = useState<number | null>(null);
    const scrollRef = useRef<number>();

    useEffect(() => {
        if (!active) return;

        const onPointerMove = (e: PointerEvent) => setDragY(e.clientY);
        document.addEventListener('pointermove', onPointerMove);
        return () => document.removeEventListener('pointermove', onPointerMove);
    }, [active]);

    useEffect(() => {
        const scroll = () => {
            if (!dragY || !container.current) return;

            const rect = container.current.getBoundingClientRect();
            const y = dragY - rect.top;
            let scrollSpeed = 0;

            if (y < THRESHOLD) {
                const intensity = (THRESHOLD - y) / THRESHOLD;
                scrollSpeed = -5 - intensity * 15;
            } else if (y > rect.height - THRESHOLD) {
                const intensity = (y - (rect.height - THRESHOLD)) / THRESHOLD;
                scrollSpeed = 5 + intensity * 15;
            }

            if (scrollSpeed !== 0) {
                virtualizer.scrollBy(Math.sign(scrollSpeed) * Math.min(Math.abs(scrollSpeed), MAX_SPEED));
                scrollRef.current = requestAnimationFrame(scroll);
            }
        };

        if (dragY) scroll();
        else if (scrollRef.current) cancelAnimationFrame(scrollRef.current);

        return () => cancelAnimationFrame(scrollRef.current ?? -1);
    }, [dragY, virtualizer, container]);

    const cleanup = useCallback(() => setDragY(null), []);

    return useMemo(() => ({ cleanup }), [cleanup]);
};

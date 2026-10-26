import type { MouseEvent as ReactMouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

import type { PanelSide } from './panelSide';
import { getDropSide, getOppositeSide } from './panelSide';

export const PANEL_DRAGGING_CLASS = 'lumo-floating-panel-dragging';

interface Options {
    bounds: Pick<DOMRect, 'left' | 'width'>;
    shownSide: PanelSide;
    isRTL: boolean;
    isEnabled: boolean;
    onDrop: () => void;
}

export const usePanelDrag = ({ bounds, shownSide, isRTL, isEnabled, onDrop }: Options) => {
    const [isDragging, setIsDragging] = useState(false);
    const [pointerSide, setPointerSide] = useState<PanelSide | null>(null);
    const stopActiveDragRef = useRef<() => void>();
    // The listeners outlive the render that started the drag, and a composer can force the side mid-drag
    const latestRef = useRef({ bounds, shownSide, isRTL, onDrop });
    latestRef.current = { bounds, shownSide, isRTL, onDrop };

    useEffect(() => {
        if (!isEnabled) {
            return;
        }
        return () => {
            stopActiveDragRef.current?.();
        };
    }, [isEnabled]);

    const startDrag = (event: ReactMouseEvent) => {
        if (event.button !== 0) {
            return;
        }
        event.preventDefault();
        // A drag whose mouseup never arrived would otherwise drop a second time on this one's release
        stopActiveDragRef.current?.();
        // Read from the moves, so a click on a handle that already reaches over the midline drops nothing
        let lastPointerSide: PanelSide | null = null;
        const listeners = new AbortController();

        const stopDrag = () => {
            listeners.abort();
            document.body.classList.remove('cursor-move', PANEL_DRAGGING_CLASS);
            stopActiveDragRef.current = undefined;
            setIsDragging(false);
            setPointerSide(null);
        };
        const handleMove = (moveEvent: MouseEvent) => {
            lastPointerSide = getDropSide(moveEvent.clientX, latestRef.current.bounds, latestRef.current.isRTL);
            setPointerSide(lastPointerSide);
        };
        const handleDrop = () => {
            stopDrag();
            if (lastPointerSide !== null && lastPointerSide !== latestRef.current.shownSide) {
                latestRef.current.onDrop();
            }
        };

        document.addEventListener('mousemove', handleMove, { signal: listeners.signal });
        document.addEventListener('mouseup', handleDrop, { signal: listeners.signal });
        // Both can swallow the mouseup, so the drag ends there without a drop
        document.addEventListener('contextmenu', stopDrag, { signal: listeners.signal });
        window.addEventListener('blur', stopDrag, { signal: listeners.signal });
        document.body.classList.add('cursor-move', PANEL_DRAGGING_CLASS);
        stopActiveDragRef.current = stopDrag;
        setIsDragging(true);
    };

    const targetSide = isDragging ? getOppositeSide(shownSide) : null;
    const isOverTarget = targetSide !== null && pointerSide === targetSide;
    return { startDrag, targetSide, isOverTarget };
};

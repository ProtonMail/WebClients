import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Browsers fire dragover every 350ms (±200ms) during a drag, even when the cursor is still
export const DRAG_IDLE_TIMEOUT_MS = 1000;

export const useUploadDragDropOverlay = (enabled: boolean) => {
    const [isOverlayVisible, setIsOverlayVisible] = useState(false);
    const isInternalDragRef = useRef(false);

    useEffect(() => {
        const handleDragStart = () => {
            isInternalDragRef.current = true;
        };
        const handleDragEnd = () => {
            isInternalDragRef.current = false;
            setIsOverlayVisible(false);
        };

        window.addEventListener('dragstart', handleDragStart, true);
        window.addEventListener('dragend', handleDragEnd, true);
        // Bubble phase on purpose: hiding the overlay in the capture phase unmounts it before React sees the drop
        // --> the overlay onDrop never runs --> the browser opens the file
        window.addEventListener('drop', handleDragEnd);
        return () => {
            window.removeEventListener('dragstart', handleDragStart, true);
            window.removeEventListener('dragend', handleDragEnd, true);
            window.removeEventListener('drop', handleDragEnd);
        };
    }, []);

    // The drag can end without any event reaching the page (Cmd+Tab, drop outside the window)
    // --> no dragover for a while --> the drag is over, hide the overlay
    useEffect(() => {
        if (!isOverlayVisible) {
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;
        const restartTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                isInternalDragRef.current = false;
                setIsOverlayVisible(false);
            }, DRAG_IDLE_TIMEOUT_MS);
        };

        restartTimer();
        window.addEventListener('dragover', restartTimer, true);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('dragover', restartTimer, true);
        };
    }, [isOverlayVisible]);

    const handleDragOver = useCallback(
        (e: React.DragEvent<HTMLElement>) => {
            // dataTransfer can be null in Firefox after switching windows mid-drag
            const isExternalFileDrag = !isInternalDragRef.current && !!e.dataTransfer?.types.includes('Files');
            if (enabled && isExternalFileDrag) {
                setIsOverlayVisible(true);
            }
        },
        [enabled]
    );

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
        // Ignore dragLeave events fired when the cursor moves over a child element of the overlay
        if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        setIsOverlayVisible(false);
    }, []);

    return {
        isOverlayVisible: enabled && isOverlayVisible,
        handleDragOver,
        handleDragLeave,
    };
};

import { useEffect, useRef } from 'react';

const LONG_TAP_TIMEOUT = 1000;

const useTooltipHandlers = (open: () => void, close: () => void, isOpen: boolean) => {
    const longTapTimeoutRef = useRef(0);
    const ignoreFocusRef = useRef(false);
    const ignoreNonTouchEventsRef = useRef(false);
    const ignoreNonTouchEventsTimeoutRef = useRef(0);

    const handleCloseTooltip = () => {
        clearTimeout(longTapTimeoutRef.current);
        longTapTimeoutRef.current = 0;
        clearTimeout(ignoreNonTouchEventsTimeoutRef.current);
        // Clear non-touch events after a small timeout to avoid the focus event accidentally triggering it after touchend
        // touchstart -> touchend -> focus
        ignoreNonTouchEventsTimeoutRef.current = window.setTimeout(() => {
            ignoreNonTouchEventsRef.current = false;
        }, 100);
        close();
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        // Edge case for elements that don't gain focus, they'll never receive a blur event to close the tooltip
        // for example if long-tapping a span with text, this is to force close the tooltip on next touchstart
        document.addEventListener('touchstart', close);
        return () => {
            document.removeEventListener('touchstart', close);
        };
    }, [isOpen, close]);

    const handleTouchStart = () => {
        clearTimeout(ignoreNonTouchEventsTimeoutRef.current);
        ignoreNonTouchEventsTimeoutRef.current = 0;
        clearTimeout(longTapTimeoutRef.current);
        // Initiate a long-tap timer to open the tooltip on touch devices
        longTapTimeoutRef.current = window.setTimeout(() => {
            open();
            longTapTimeoutRef.current = 0;
        }, LONG_TAP_TIMEOUT);
        // Also set to ignore non-touch events
        ignoreNonTouchEventsRef.current = true;
    };

    const handleTouchEnd = () => {
        // Tooltip was opened from a long tap, no need to close
        if (isOpen && !longTapTimeoutRef.current) {
            return;
        }
        // Otherwise it's either not opened or it wasn't opened from the long tap, so we can set to close the tooltip
        clearTimeout(longTapTimeoutRef.current);
        longTapTimeoutRef.current = 0;
        handleCloseTooltip();
    };

    const handleMouseEnter = () => {
        if (ignoreNonTouchEventsRef.current) {
            return;
        }
        open();
    };

    const handleMouseDown = () => {
        if (ignoreNonTouchEventsRef.current) {
            return;
        }
        // Close the tooltip on mouse down, and ignore the upcoming focus event (on chrome)
        ignoreFocusRef.current = true;
        close();
    };

    const handleMouseLeave = () => {
        // Reset the ignore focus when leaving the element
        ignoreFocusRef.current = false;
        if (ignoreNonTouchEventsRef.current) {
            return;
        }
        close();
    };

    const handleFocus = () => {
        // Reset ignore focus if it's set. Manages the case for
        // mousedown -> mouseup -> focus
        // and mouseleave never triggered, just as a safety mechanism to reset ignore
        if (ignoreNonTouchEventsRef.current || ignoreFocusRef.current) {
            ignoreFocusRef.current = false;
            return;
        }
        open();
    };

    return {
        onTouchEnd: handleTouchEnd,
        onTouchStart: handleTouchStart,
        onMouseDown: handleMouseDown,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleCloseTooltip,
    };
};

export default useTooltipHandlers;

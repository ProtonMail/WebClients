import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import { usePrevious } from '@proton/hooks';

const LONG_TAP_TIMEOUT = 500;
const OPEN_DELAY_TIMEOUT = 1000;
const CLOSE_DELAY_TIMEOUT = 250;

let visibleTimeout = 0;
let globalId = 0;

enum State {
    Opened,
    Closing,
}

type CloseCb = (immediate?: boolean) => void;
type OpenCb = (immediate?: boolean) => void;

const tooltips = new Map<number, { state: State; close: MutableRefObject<CloseCb> }>();

const closePendingTooltips = () => {
    for (const [id, entry] of tooltips) {
        if (entry.state === State.Closing) {
            entry.close.current();
            tooltips.delete(id);
        }
    }
};

interface Props {
    open: OpenCb;
    close: CloseCb;
    isOpen: boolean;
    isExternalOpen?: boolean;
    openDelay?: number;
    closeDelay?: number;
    longTapDelay?: number;
}

export const useTooltipHandlers = ({
    open: outsideOpen,
    close: outsideClose,
    isOpen,
    isExternalOpen,
    openDelay = OPEN_DELAY_TIMEOUT,
    closeDelay = CLOSE_DELAY_TIMEOUT,
    longTapDelay = LONG_TAP_TIMEOUT,
}: Props) => {
    const idRef = useRef(-1);
    if (idRef.current === -1) {
        idRef.current = ++globalId;
    }
    const id = idRef.current;

    const closeTimeoutRef = useRef(0);
    const longTapTimeoutRef = useRef(0);
    const ignoreFocusRef = useRef(false);
    const ignoreNonTouchEventsRef = useRef(false);
    const ignoreNonTouchEventsTimeoutRef = useRef(0);
    const closeRef = useRef(outsideClose);
    const openRef = useRef(outsideOpen);
    const wasExternallyOpened = usePrevious(isExternalOpen);

    useEffect(() => {
        const entry = tooltips.get(id);
        if (!entry) {
            return;
        }
        closeRef.current = outsideClose;
        openRef.current = outsideOpen;
    });

    useEffect(() => {
        return () => {
            window.clearTimeout(closeTimeoutRef.current);
            window.clearTimeout(longTapTimeoutRef.current);
            window.clearTimeout(ignoreNonTouchEventsTimeoutRef.current);
            tooltips.get(id)?.close.current();
            tooltips.delete(id);
        };
    }, [id]);

    const open = (immediate?: boolean) => {
        window.clearTimeout(visibleTimeout);
        window.clearTimeout(closeTimeoutRef.current);
        const oldTooltip = tooltips.get(id);
        tooltips.set(id, { state: State.Opened, close: closeRef });
        if (oldTooltip?.state === State.Closing) {
            return;
        }
        closePendingTooltips();
        openRef.current(immediate);
    };

    const close = () => {
        window.clearTimeout(visibleTimeout);
        // Trying to close something that isn't open.
        if (tooltips.get(id)?.state !== State.Opened) {
            return;
        }

        window.clearTimeout(closeTimeoutRef.current);
        if (!closeDelay) {
            outsideClose();
            tooltips.delete(id);
            return;
        }

        tooltips.set(id, { state: State.Closing, close: closeRef });
        closeTimeoutRef.current = window.setTimeout(() => {
            const entry = tooltips.get(id);
            if (entry?.state === State.Closing) {
                entry.close.current(false);
                tooltips.delete(id);
            }
        }, closeDelay);
    };

    const handleCloseTooltip = () => {
        window.clearTimeout(longTapTimeoutRef.current);
        longTapTimeoutRef.current = 0;
        window.clearTimeout(ignoreNonTouchEventsTimeoutRef.current);
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
        window.clearTimeout(ignoreNonTouchEventsTimeoutRef.current);
        ignoreNonTouchEventsTimeoutRef.current = 0;
        window.clearTimeout(longTapTimeoutRef.current);
        // Initiate a long-tap timer to open the tooltip on touch devices
        longTapTimeoutRef.current = window.setTimeout(() => {
            open();
            longTapTimeoutRef.current = 0;
        }, longTapDelay);
        // Also set to ignore non-touch events
        ignoreNonTouchEventsRef.current = true;
    };

    const handleTouchEnd = () => {
        // Tooltip was opened from a long tap, no need to close
        if (isOpen && !longTapTimeoutRef.current) {
            return;
        }
        // Otherwise it's either not opened or it wasn't opened from the long tap, so we can set to close the tooltip
        window.clearTimeout(longTapTimeoutRef.current);
        longTapTimeoutRef.current = 0;
        handleCloseTooltip();
    };

    const handleMouseEnter = () => {
        if (ignoreNonTouchEventsRef.current) {
            return;
        }
        window.clearTimeout(visibleTimeout);
        if (tooltips.size || !openDelay || isOpen) {
            open();
        } else {
            visibleTimeout = window.setTimeout(() => {
                open(false);
            }, openDelay);
        }
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
        // Reset ignore focus when leaving the element
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

    useEffect(() => {
        /**
         * if `isExternalOpen` shifted from being `true`
         * to `undefined` we can safely close the tooltip :
         * the tooltip is no longer externally controllable
         * (ie: errored InputField lost focus)
         */
        if (isExternalOpen === undefined) {
            if (wasExternallyOpened) {
                close();
            }

            return;
        }

        if (isExternalOpen && !isOpen) {
            return open();
        }

        if (!isExternalOpen && isOpen) {
            return close();
        }
    }, [isExternalOpen, isOpen]);

    if (isExternalOpen !== undefined) {
        return {};
    }

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

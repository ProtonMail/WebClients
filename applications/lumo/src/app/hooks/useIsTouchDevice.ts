import { useEffect, useState } from 'react';

/**
 * Detects whether the primary input device is a touch/stylus (no fine pointer, no hover).
 * Uses `(hover: none) and (pointer: coarse)` which reliably identifies touch-only devices
 * (phones, tablets) regardless of viewport width.
 *
 * This is intentionally separate from "small screen" detection because an iPad or an iPhone
 * in landscape mode can have a viewport wider than the small breakpoint while still being
 * a touch-only device incapable of triggering CSS :hover states.
 */
const TOUCH_MEDIA_QUERY = '(hover: none) and (pointer: coarse)';

export const useIsTouchDevice = (): boolean => {
    const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return window.matchMedia(TOUCH_MEDIA_QUERY).matches;
    });

    useEffect(() => {
        const mediaQueryList = window.matchMedia(TOUCH_MEDIA_QUERY);
        const handleChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);

        mediaQueryList.addEventListener('change', handleChange);
        return () => mediaQueryList.removeEventListener('change', handleChange);
    }, []);

    return isTouchDevice;
};

import { useEffect, useRef } from 'react';

/**
 * The shared Toggle is natively disabled while loading, so the browser moves focus to the page body
 * (or a focus trap moves it to its container) when a focused toggle starts saving. Put it back once
 * saving ends, unless focus moved to another control.
 */
export const useRestoreFocusAfterLoading = (loading: boolean) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hadFocusRef = useRef(false);

    const trackFocus = () => {
        hadFocusRef.current = document.activeElement === inputRef.current;
    };

    useEffect(() => {
        if (loading || !hadFocusRef.current) {
            return;
        }
        hadFocusRef.current = false;

        const input = inputRef.current;
        const active = document.activeElement;
        const focusLost = !active || active === document.body || (!!input && active.contains(input));
        if (focusLost) {
            input?.focus();
        }
    }, [loading]);

    return { inputRef, trackFocus };
};

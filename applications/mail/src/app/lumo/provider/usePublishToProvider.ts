import { useLayoutEffect } from 'react';

/** Hands `value` up to the provider on every render, and clears it on unmount. */
export const usePublishToProvider = <T>(value: T, onValue: (value: T | null) => void) => {
    useLayoutEffect(() => {
        onValue(value);
    });

    useLayoutEffect(() => {
        return () => {
            onValue(null);
        };
    }, [onValue]);
};

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DELAY = 5000;

export const useAwaitingTouch = (delay = DEFAULT_DELAY) => {
    const [awaitingTouch, setAwaitingTouch] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clear = useCallback(() => {
        if (timeoutRef.current !== null) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const startAwaitingTouch = useCallback(() => {
        clear();
        timeoutRef.current = setTimeout(() => {
            setAwaitingTouch(true);
        }, delay);
    }, [clear, delay]);

    const stopAwaitingTouch = useCallback(() => {
        clear();
        setAwaitingTouch(false);
    }, [clear]);

    useEffect(() => clear, [clear]);

    return { awaitingTouch, startAwaitingTouch, stopAwaitingTouch };
};

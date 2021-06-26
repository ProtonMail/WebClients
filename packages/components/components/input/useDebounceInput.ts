import { useState, useRef, useCallback, useEffect } from 'react';

export default function useDebounceInput<T>(value: T, delay = 500) {
    const [currentValue, setCurrentValue] = useState<T>(value);
    const interval = useRef(0);

    const clean = useCallback(() => {
        window.clearInterval(interval.current);
    }, []);

    useEffect(() => {
        if (!delay) {
            return setCurrentValue(value);
        }
        interval.current = window.setTimeout(() => {
            setCurrentValue(value);
        }, delay);
        return clean;
    }, [value, delay]);

    useEffect(() => clean, []);

    return !delay ? value : currentValue;
}

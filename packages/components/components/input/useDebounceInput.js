import { useState, useRef, useCallback, useEffect } from 'react';

export default function useDebounceInput(value, delay = 500) {
    const [currentValue, setCurrentValue] = useState(value);
    const interval = useRef(null);

    const clean = useCallback(() => {
        if (interval.current !== null) {
            clearInterval(interval.current);
        }
    }, []);

    useEffect(() => {
        interval.current = setTimeout(() => {
            setCurrentValue(value);
        }, delay);
        return clean;
    }, [value, delay]);

    useEffect(() => clean, []);

    return currentValue;
}

import { useState, useEffect } from 'react';

/**
 * Slow down changes on a value, mostly to let user see steps
 * Doesn't drop steps but stack them
 * Falsy value are not preserved
 */
export const useSlowChanges = <T>(currentValue: T, time = 500): T => {
    const [value, setValue] = useState<T>(currentValue);
    const [stack, setStack] = useState<T[]>([]);
    const [timeout, setTimeoutState] = useState<NodeJS.Timeout>();

    const runTimeout = () => setTimeoutState(setTimeout(() => setTimeoutState(undefined), time));

    useEffect(() => {
        if (timeout === undefined) {
            if (currentValue) {
                runTimeout();
            }
            setValue(currentValue);
        } else {
            setStack([...stack, currentValue]);
        }
    }, [currentValue]);

    useEffect(() => {
        if (timeout === undefined && stack.length > 0) {
            const [first, ...rest] = stack;
            setValue(first);
            setStack(rest);
            runTimeout();
        }
    }, [timeout, stack]);

    return value;
};

import { useState, useEffect } from 'react';

interface Props {
    refreshInterval: number;
    tolerance: number;
}
const useHasSuspendedCounter = ({ refreshInterval, tolerance }: Props) => {
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        let previousTime = Date.now();
        let unmounted = false;

        const intervalHandle = window.setInterval(() => {
            const currentTime = Date.now();
            const computedInterval = currentTime - previousTime;
            const isOutOfSync = Math.abs(computedInterval - refreshInterval) > tolerance;
            if (isOutOfSync && !unmounted) {
                setCounter((counter) => counter + 1);
            }
            previousTime = currentTime;
        }, refreshInterval);

        return () => {
            unmounted = true;
            clearInterval(intervalHandle);
        };
    }, [refreshInterval, tolerance]);

    return counter;
};

export default useHasSuspendedCounter;

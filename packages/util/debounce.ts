interface DebounceOptions {
    /**
     * Invokes function immediately at the leading edge of the debounced calls
     */
    immediate?: boolean;
}

/**
 * Creates a debounced function that delays invoking `func` until
 * after `wait` milliseconds have elapsed since the last time the
 * debounced function was invoked.
 *
 * The debounced function comes with an `abort` method to cancel
 * delayed `func` invocations.
 */
export default function debounce<A extends any[]>(
    /**
     * Function to debounce.
     */
    func: (...args: A) => void,
    /**
     * Number of milliseconds to delay.
     */
    wait: number,
    { immediate = false }: DebounceOptions = {}
) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function debouncedFunction(this: any, ...args: A): void {
        const later = () => {
            timeoutId = undefined;
            if (!immediate) {
                func.apply(this, args);
            }
        };

        const shouldCallNow = immediate && timeoutId === undefined;

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(later, wait);

        if (shouldCallNow) {
            func.apply(this, args);
        }
    }

    debouncedFunction.abort = () => {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }
    };

    return debouncedFunction;
}

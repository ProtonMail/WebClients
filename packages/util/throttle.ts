/**
 * Creates a throttled function that only invokes `func` at most
 * once per every `wait` milliseconds.
 */
export default function throttle<A extends any[]>(
    /**
     * Function to debounce.
     */
    func: (...args: A) => void,
    /**
     * Number of milliseconds to throttle invocations to.
     */
    wait: number
) {
    let throttle = false;

    function throttledFunction(this: any, ...args: A) {
        if (throttle) {
            return;
        }

        throttle = true;
        setTimeout(() => {
            throttle = false;
        }, wait);

        func.apply(this, args);
    }

    return throttledFunction;
}

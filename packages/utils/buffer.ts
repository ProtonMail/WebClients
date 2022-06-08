/**
 * Similar to throttle but ensures first and last calls are made
 */
export default function buffer<A extends any[]>(
    /**
     * Function to throttle.
     */
    func: (...args: A) => void,
    /**
     * Number of milliseconds to throttle invocations to.
     */
    wait: number
) {
    let cooldown: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: A | undefined;

    const run = (...args: A) => {
        if (!cooldown) {
            func(...args);

            cooldown = setTimeout(() => {
                cooldown = undefined;

                if (lastArgs) {
                    const fnArgs = lastArgs;
                    lastArgs = undefined;
                    run(...fnArgs);
                }
            }, wait);
        } else {
            lastArgs = args;
        }
    };

    return run;
}

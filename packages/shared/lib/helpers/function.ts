export const noop = () => undefined;
export const identity = <T>(value: T) => value;

/**
 * Wrap a function to ensure only one argument will pass through
 */
export const unary = <A>(fn: Function) => (arg: A) => fn(arg);

export const debounce = <A extends any[]>(func: (...args: A) => void, wait: number, isImmediate?: boolean) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    function debouncedFunction(this: any, ...args: A) {
        const later = () => {
            timeoutId = undefined;
            if (!isImmediate) {
                func.apply(this, args);
            }
        };

        const shouldCallNow = isImmediate && timeoutId === undefined;

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
};

export const throttle = <A extends any[]>(func: (...args: A) => void, ms = 50, context = window) => {
    let wait = false;

    return (...args: A) => {
        const later = () => {
            func.apply(context, args);
        };

        if (!wait) {
            later();
            wait = true;
            setTimeout(() => {
                wait = false;
            }, ms);
        }
    };
};

/** Similar to throttle but ensures first and last calls are made */
export const buffer = <A extends any[]>(func: (...args: A) => void, ms = 50) => {
    let cooldown: any;
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
            }, ms);
        } else {
            lastArgs = args;
        }
    };

    return run;
};

export function defer(cb: () => void, delay: number) {
    const id = setTimeout(() => {
        cb();
        clearTimeout(id);
    }, delay);
}

export function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

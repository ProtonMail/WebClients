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

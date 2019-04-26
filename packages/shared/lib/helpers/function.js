export const noop = () => {};

export const debounce = (func, wait, immediate) => {
    let timeout;

    return function executedFunction(...args) {
        const context = this;

        const later = () => {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);

        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
    };
};

export const throttle = (func, ms = 50, context = window) => {
    let wait = false;

    return (...args) => {
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

export function defer(cb, delay) {
    const id = setTimeout(() => {
        cb();
        clearTimeout(id);
    }, delay);
}

export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

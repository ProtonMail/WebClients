export function defer(cb: () => void, delay: number) {
    const id = setTimeout(() => {
        cb();
        clearTimeout(id);
    }, delay);
}

export function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

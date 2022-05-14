export function defer(cb: () => void, delay: number) {
    const id = setTimeout(() => {
        cb();
        clearTimeout(id);
    }, delay);
}

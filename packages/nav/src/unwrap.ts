export type Unwrap<T> = T | (() => T);

export function unwrap<T>(value: Unwrap<T>): T {
    return typeof value === 'function' ? (value as () => T)() : value;
}

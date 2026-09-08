// Wrap a function to allow undefined
export function consider<T, U>(f: (x: T) => U): (x: T | undefined) => U | undefined;
export function consider<T, U>(f: (x: T) => U): (x: undefined) => undefined;
export function consider<T, U>(f: (x: T) => U): (x: T) => U;
export function consider<T, U>(f: (x: T) => U): (x: T | undefined) => U | undefined {
    return (x: T | undefined) => (x !== undefined ? f(x) : undefined);
}

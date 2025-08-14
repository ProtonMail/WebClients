// These fallbacks are used in places where returning the same `{}` or the same `[]` is desired.
// (As a reminder, `{} !== {}` and `[] !== []` because the expressions `{}` and `[]` return a new instance every time.)
//
// If we don't do fallbacks, it's not the end of the world, but we get annoying React warnings such as:
// > Selector [...] returned a different result when called with the same parameters.
// > This can lead to unnecessary rerenders.

export type EmptyObject = Record<string, never>;
export type EmptyArray = never[];

export function isEmptyObject(obj: any): obj is EmptyObject {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function fallbackOnEmptyObject<T>(x: T, emptyFallback: EmptyObject): T | EmptyObject {
    return isEmptyObject(x) ? emptyFallback : x;
}

export function isEmptyArray(obj: any): obj is EmptyArray {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function fallbackOnEmptyArray<T>(x: T, emptyFallback: EmptyArray): T | EmptyArray {
    return isEmptyArray(x) ? emptyFallback : x;
}

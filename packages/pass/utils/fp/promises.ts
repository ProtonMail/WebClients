type UnwrapPromise<T> = T extends any[] ? { [K in keyof T]: UnwrapPromise<T[K]> } : T extends Promise<infer U> ? U : T;

/**
 * this util will recursively unwrap promises in any
 * list like structure - it is useful in when working
 * with asynchronous & deeply nested data-structures.
 *
 * await unwrap([1,2,Promise.resolve(3)]) // [1,2,3]
 * await unwrap([1,2,[Promise.resolve(3)]) // [1,2,[3]]
 * await unwrap([[Promise.resolve(1)],[Promise.resolve(2)]]) // [[1],[2]]
 */
export const unwrap = async <T extends any[]>(arr: [...T]): Promise<UnwrapPromise<T>> =>
    Promise.all(arr.map((value) => (Array.isArray(value) ? unwrap(value) : value))) as Promise<UnwrapPromise<T>>;

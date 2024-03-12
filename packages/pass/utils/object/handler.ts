import type { Callback } from '@proton/pass/types';

import { partialMerge } from './merge';

/** Handles edge-case where object property is a function - in this
 * case do not allow passing a setter function */
type Setter<T, K extends keyof T> = T[K] extends Callback ? T[K] : T[K] | ((prev: T[K]) => T[K]);

export type ObjectHandler<T, R = T> = {
    data: R;
    get: <K extends keyof T>(key: K) => T[K];
    merge: (obj: Partial<T>) => ObjectHandler<T, R>;
    set: <K extends keyof T>(key: K, value: Setter<T, K>) => ObjectHandler<T, R>;
};

/** Creates a handler for the given object, allowing controlled access to its
 * properties. This promotes a read/write layer over direct object mutation by
 * passing around a handle instead of the object itself to functions consuming
 * the underlying data. The object is kept referentially equal under the hood. */
export const objectHandler = <T extends object, R extends any = T>(
    data: T,
    map?: (data: T) => R
): ObjectHandler<T, R> => {
    const handler: ObjectHandler<T, R> = {
        get data() {
            const obj = Object.freeze({ ...data });
            return (map?.(obj) ?? obj) as R;
        },
        merge: (obj) => {
            data = partialMerge(data, obj);
            return handler;
        },
        get: (key) => data[key],
        set: (key, value) => {
            data[key] = typeof value === 'function' ? value(data[key]) : value;
            return handler;
        },
    };

    return handler;
};

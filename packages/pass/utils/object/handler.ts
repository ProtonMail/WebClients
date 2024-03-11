export type ObjectHandler<T> = {
    data: T;
    get: <K extends keyof T>(key: K) => T[K];
    set: <K extends keyof T>(key: K, value: T[K]) => void;
};

/** Creates a handler for the given object, allowing controlled access to its
 * properties. This promotes a read/write layer over direct object mutation by
 * passing around a handle instead of the object itself to functions consuming
 * the underlying data. The object is kept referentially equal under the hood. */
export const objectHandler = <T extends object>(data: T): ObjectHandler<T> => ({
    get data() {
        return Object.freeze({ ...data });
    },
    get: (key) => data[key],
    set: (key, value) => (data[key] = value),
});

/**
 * Recursively removes undefined fields from an object or array.
 * This is useful for comparing objects in tests where some fields might be undefined.
 *
 * @param obj The object or array to clean
 * @returns A new object or array with all undefined fields removed
 */
export function clarify<T>(obj: T): T {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(clarify) as T;
    }

    if (typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj)
                .filter(([_, value]) => value !== undefined)
                .map(([key, value]) => [key, clarify(value)])
        ) as T;
    }

    return obj;
}

/**
 * Build an array with a numeric range, specified by a start, an end, and a step
 */

export const range = (start = 0, end = 1, step = 1) => {
    const result = [];
    for (let index = start; index < end; index += step) {
        result.push(index);
    }
    return result;
};

/**
 * Divide an array into sub-arrays of a fixed chunk size
 */
export const chunk = <T>(list: T[] = [], size = 1) => {
    return list.reduce<T[][]>((res, item, index) => {
        if (index % size === 0) {
            res.push([]);
        }
        res[res.length - 1].push(item);
        return res;
    }, []);
};

/**
 * Extract the elements from an array that are unique according to a comparator function
 */
export const uniqueBy = <T>(array: T[], comparator: (t: T) => any) => {
    const seen = new Set();
    return array.filter((value) => {
        const computed = comparator(value);
        const hasSeen = seen.has(computed);
        if (!hasSeen) {
            seen.add(computed);
        }
        return !hasSeen;
    });
};

export const unique = <T>(array: T[]) => uniqueBy(array, (x) => x);

/**
 * Returns a new array with the item moved to the new position.
 * @param list List of items
 * @param from Index of item to move. If negative, it will begin that many elements from the end.
 * @param to Index of where to move the item. If negative, it will begin that many elements from the end.
 * @return New array with the item moved to the new position
 */
export const move = <T>(list: T[] = [], from: number, to: number) => {
    const copy = list.slice();
    copy.splice(to < 0 ? copy.length + to : to, 0, copy.splice(from, 1)[0]);
    return copy;
};

/**
 * Remove the first occurrence of an item from an array. Return a copy of the updated array
 */
export const remove = <T>(arr: T[], item: T) => {
    const i = arr.indexOf(item);
    if (i === -1) {
        return arr;
    }
    const result = arr.slice();
    result.splice(i, 1);
    return result;
};

/**
 * Replace the first occurrence of an item from an array by another item. Return a copy of the updated array
 */
export const replace = <T>(arr: T[], item: T, replacement: T) => {
    const i = arr.indexOf(item);
    if (i === -1) {
        return arr;
    }
    const result = arr.slice();
    result.splice(i, 1, replacement);
    return result;
};

/**
 * Returns difference of two array of strings
 */
export const diff = <T>(arr1: T[], arr2: T[]) => arr1.filter((a) => !arr2.includes(a));

/**
 * Groups elements in an array by a provided comparison function.
 * E.g. `[1, 1, 2, 3, 3] => [[1, 1], [2], [3, 3]]`
 */
export const groupWith = <T>(compare: (a: T, b: T) => boolean, arr: T[] = []) => {
    const { groups } = arr.reduce<{ groups: T[][]; remaining: T[] }>(
        (acc, a) => {
            const { groups, remaining } = acc;
            const group = remaining.filter((b) => compare(a, b));

            if (group.length) {
                acc.groups = [...groups, group];
                acc.remaining = remaining.filter((b) => !compare(a, b));
                return acc;
            }

            return acc;
        },
        { groups: [], remaining: arr }
    );
    return groups;
};

/**
 * Returns the item that has minimum value as determined by fn property selector function.
 * E.g.: `minBy(({ a }) => a, [{a: 4}, {a: 2}, {a: 5}])` returns `{a: 2}`
 */
export const minBy = <T>(fn: (a: T) => any, arr: T[] = []) => {
    return arr.reduce((min, item) => {
        return fn(item) < fn(min) ? item : min;
    }, arr[0]);
};

/**
 * Order collection of object by a specific key
 */
export const orderBy = <T, K extends keyof T>(collection: T[] = [], key: K) => {
    return collection.slice().sort((a, b) => {
        if (a[key] > b[key]) {
            return 1;
        }
        if (a[key] < b[key]) {
            return -1;
        }
        return 0;
    });
};

/**
 * Determine if two arrays are shallowy equal (i.e. they have the same length and the same elements)
 */
export const shallowEqual = <T>(a: T[], b: T[]) => {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
};

/**
 * Basic comparator function that transforms order via >,< into the numeric order that sorting functions typically require
 */
export const compare = (a: any, b: any) => {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
};

export const mergeUint8Arrays = (arrays: Uint8Array[]) => {
    const length = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const chunksAll = new Uint8Array(length);
    arrays.reduce((position, arr) => {
        chunksAll.set(arr, position);
        return position + arr.length;
    }, 0);
    return chunksAll;
};

export function areUint8Arrays(arr: any[]): arr is Uint8Array[] {
    return arr.every((el) => el instanceof Uint8Array);
}

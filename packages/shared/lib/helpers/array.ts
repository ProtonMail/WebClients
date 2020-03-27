export const range = (start = 0, end = 1, step = 1) => {
    const result = [];
    for (let index = start; index < end; index += step) {
        result.push(index);
    }
    return result;
};

export const chunk = <T>(list: T[] = [], size = 1) => {
    return list.reduce((res, item, index) => {
        if (index % size === 0) {
            res.push([]);
        }
        res[res.length - 1].push(item);
        return res;
    }, [] as T[][]);
};

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
 * Remove the first occurrence of an item from an array.
 * @param arr
 * @param item    The item to remove
 * @returns copy of the updated array.
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
 * Replace the first occurrence of an item from an array by another item.
 * @param arr
 * @param item            The item to be replaced
 * @param replacement     The replacement item
 * @returns copy of the updated array.
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
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {Array} diff
 */
export const diff = <T>(arr1: T[], arr2: T[]) => arr1.filter((a) => !arr2.includes(a));

/**
 * Groups elements in an array by a provided comparison function. E.g. `[1, 1, 2, 3, 3] => [[1, 1], [2], [3, 3]]`
 * @param compare fn whose result tells if elements belong to the same group
 * @param arr
 */
export const groupWith = <T>(compare: (a: T, b: T) => boolean, arr: T[] = []) => {
    const { groups } = arr.reduce(
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
        // eslint-disable-next-line @typescript-eslint/no-object-literal-type-assertion
        { groups: [], remaining: arr } as { groups: T[][]; remaining: T[] }
    );

    return groups;
};

/**
 * Returns the item that has minimum value as determined by fn property selector function. E.g.: `minBy(({ a }) => a, [{a: 4}, {a: 2}, {a: 5}])` returns `{a: 2}`
 * @param fn object property selector
 * @param arr array to search in
 */
export const minBy = <T>(fn: (a: T) => any, arr: T[] = []) => {
    return arr.reduce((min, item) => {
        return fn(item) < fn(min) ? item : min;
    }, arr[0]);
};

/**
 * Order collection of object by a specific key
 * @param collection
 * @param key
 * @returns new collection
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

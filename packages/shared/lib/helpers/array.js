export const range = (start = 0, end = 1, step = 1) => {
    const result = [];

    for (let index = start; index < end; index += step) {
        result.push(index);
    }

    return result;
};

export const chunk = (list = [], size = 1) => {
    return list.reduce((res, item, index) => {
        if (index % size === 0) {
            res.push([]);
        }
        res[res.length - 1].push(item);
        return res;
    }, []);
};

export const compare = (a, b) => {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
};

export const uniqueBy = (array, comparator) => {
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

export const unique = (array) => uniqueBy(array, (x) => x);

/**
 * Returns a new array with the item moved to the new position.
 * @param {Array} array List of items
 * @param {number} from Index of item to move. If negative, it will begin that many elements from the end.
 * @param {number} to Index of where to move the item. If negative, it will begin that many elements from the end.
 * @return {Array} New array with the item moved to the new position
 */
export const move = (list = [], from, to) => {
    const copy = list.slice();
    copy.splice(to < 0 ? copy.length + to : to, 0, copy.splice(from, 1)[0]);
    return copy;
};

/**
 * Remove an item from an array.
 * @param {Array} arr
 * @param {Object} item The item to remove
 * @returns {Array} copy of the updated array.
 */
export const remove = (arr, item) => {
    const i = arr.indexOf(item);
    if (i === -1) {
        return arr;
    }
    const result = arr.slice();
    result.splice(i, 1);
    return result;
};

/**
 * Returns difference of two array of strings
 * @param {Array} arr1
 * @param {Array} arr2
 * @returns {Array} diff
 */
export const diff = (arr1, arr2) => arr1.filter((a) => !arr2.includes(a));

/**
 * Groups elements in an array by a provided comparison function. E.g. `[1, 1, 2, 3, 3] => [[1, 1], [2], [3, 3]]`
 * @param {(a, b) => boolean} compare fn whose result tells if elements belong to the same group
 * @param {Array} arr
 */
export const groupWith = (compare, arr = []) => {
    const { groups } = arr.reduce(
        ({ groups, remaining }, a) => {
            const group = remaining.filter((b) => compare(a, b));
            return group.length
                ? {
                      groups: [...groups, group],
                      remaining: remaining.filter((b) => !compare(a, b))
                  }
                : { groups, remaining };
        },
        { groups: [], remaining: arr }
    );

    return groups;
};

/**
 * Returns the item that has minimum value as determined by fn property selector function. E.g.: `minBy(({ a }) => a, [{a: 4}, {a: 2}, {a: 5}])` returns `{a: 2}`
 * @param {(a) => number} fn object property selector
 * @param {Array} arr array to search in
 */
export const minBy = (fn, arr = []) => arr.reduce((min, item) => (fn(item) < fn(min) ? item : min), arr[0]);

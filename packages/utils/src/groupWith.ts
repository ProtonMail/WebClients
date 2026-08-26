/**
 * Groups elements in an array by a provided comparison function.
 * E.g. `[1, 1, 2, 3, 3] => [[1, 1], [2], [3, 3]]`
 */
const groupWith = <T>(compare: (a: T, b: T) => boolean, arr: T[] = []) => {
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

export default groupWith;

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

export const partition = <T, K = T>(arr: (T | K)[], predicate: (item: T | K) => item is T): [T[], K[]] =>
    arr.reduce<[T[], K[]]>(
        (accumulator, current) => {
            if (predicate(current)) {
                accumulator[0].push(current);
            } else {
                accumulator[1].push(current);
            }

            return accumulator;
        },
        [[], []]
    );

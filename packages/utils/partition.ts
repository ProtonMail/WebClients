/**
 * Creates an array of elements split into two groups, the first of which contains elements predicate returns
 * truthy for, the second of which contains elements predicate returns falsey for.
 */
export default function partition<T, K = T>(arr: (T | K)[], predicate: (item: T | K) => item is T): [T[], K[]] {
    return arr.reduce<[T[], K[]]>(
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
}

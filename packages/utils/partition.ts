/**
 * Creates an array of elements split into two groups, the first of which contains elements predicate returns
 * truthy for, the second of which contains elements predicate returns falsey for.
 */
export default function partition<T, K = T>(arr: (T | K)[], predicate: (item: T | K) => item is T): [T[], K[]] {
    const truthyItems: T[] = [];
    const falseyItems: K[] = [];

    for (const item of arr) {
        if (predicate(item)) {
            truthyItems.push(item);
        } else {
            falseyItems.push(item);
        }
    }

    return [truthyItems, falseyItems];
}

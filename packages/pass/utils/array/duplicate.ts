export const duplicates = <T>(arr: T[]) =>
    arr.reduce<Map<T, number>>((acc, item) => acc.set(item, (acc.get(item) ?? 0) + 1), new Map());

/** Removes duplicates from an array based on the provided equality function.
 * This function is suitable for relatively "small" arrays. */
export const deduplicate = <T>(arr: T[], eq: (a: T) => (b: T) => boolean): T[] =>
    arr.filter((a, idx) => arr.findIndex((b) => eq(a)(b)) === idx);

export const duplicates = <T>(arr: T[]) =>
    arr.reduce<Map<T, number>>((acc, item) => acc.set(item, (acc.get(item) ?? 0) + 1), new Map());

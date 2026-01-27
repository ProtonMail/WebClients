/* eslint-disable no-nested-ternary */

export const mapify = <T extends { id: string }>(xs: T[]): Record<string, T> => {
    return Object.fromEntries(xs.map((x) => [x.id, x]));
};

export const listify = <T>(xs: Iterable<T> | Record<string, T> | Map<string, T> | Set<T>): T[] => {
    if (xs instanceof Map) {
        return Array.from(xs.values());
    }
    if (xs instanceof Set) {
        return [...xs];
    }
    return Object.values(xs);
};

export const realmapify = <T extends { id: string }>(xs: T[]): Map<string, T> => {
    return new Map(xs.map((x) => [x.id, x]));
};

export const mapKeys = <K, T>(xs: Record<string, T> | Map<K, T>): K[] => {
    if (xs instanceof Map) {
        return Array.from(xs.keys());
    }
    return Object.keys(xs) as unknown as K[];
};

export const mapLength = <T>(xs: Record<string, T>): number => {
    return mapKeys(xs).length;
};

export const mapEmpty = <T>(xs: Record<string, T>): boolean => {
    return mapLength(xs) === 0;
};

export const mapIds = <T extends { id: string }>(xs: Record<string, T>): string[] => {
    return listIds(listify(xs));
};

export const setIds = <T extends { id: string }>(xs: Iterable<T> | Record<string, T>): Set<string> => {
    return new Set(listIds(listify(xs)));
};

export const setify = <T>(xs: Iterable<T> | Record<string, T>): Set<T> => {
    return new Set(Array.isArray(xs) ? xs : Object.values(xs));
};

export const listIds = <T extends { id: string }>(xs: T[]): string[] => {
    return xs.map((x) => x.id);
};

export const dedup = <T>(xs: Iterable<T>): T[] => {
    return listify(setify(xs));
};

export const when = <T, U extends T[] | Record<string, T>>(condition: boolean, data: U): U => {
    return condition ? data : Array.isArray(data) ? ([] as unknown as U) : ({} as unknown as U);
};

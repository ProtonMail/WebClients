export const compare = <T>(a: T, b: T): number => {
    if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return 0; /* else cannot compare */
};

export const sortOn =
    <T extends { [key: string]: any }, K extends keyof T>(key: K, order: 'ASC' | 'DESC' = 'DESC') =>
    (a: T, b: T): number =>
        order === 'DESC' ? compare(b[key], a[key]) : compare(a[key], b[key]);

export const liftSort =
    <T, V>(compare: (a: T, b: T) => number, map: (a: V) => T): ((a: V, b: V) => number) =>
    (a, b) =>
        compare(map(a), map(b));

export const chainSort =
    <T>(...comparators: ((a: T, b: T) => number)[]) =>
    (a: T, b: T): number =>
        comparators.reduce((result, comparator) => (result !== 0 ? result : comparator(a, b)), 0);

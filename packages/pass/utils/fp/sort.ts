type SortOrder = 'ASC' | 'DESC';

const nullOrUndefined = (val: unknown) => val === null || val === undefined;

export const sortOn =
    <T extends { [key: string]: any }, K extends keyof T>(key: K, order: SortOrder = 'DESC') =>
    (x1: T, x2: T): number => {
        const a = (order === 'DESC' ? x2 : x1)[key];
        const b = (order === 'DESC' ? x1 : x2)[key];

        const nullishA = nullOrUndefined(a);
        const nullishB = nullOrUndefined(b);

        if (nullishA && nullishB) return 0;
        if (nullishA) return order === 'DESC' ? -1 : 1; /* Move undefined values to the end */
        if (nullishB) return order === 'DESC' ? 1 : -1; /* Keep defined values at the front */

        if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);

        return 0;
    };

export const liftSort =
    <T, V>(compare: (a: T, b: T) => number, map: (a: V) => T): ((a: V, b: V) => number) =>
    (a, b) =>
        compare(map(a), map(b));

export const chainSort =
    <T>(...comparators: ((a: T, b: T) => number)[]) =>
    (a: T, b: T): number =>
        comparators.reduce((result, comparator) => (result !== 0 ? result : comparator(a, b)), 0);

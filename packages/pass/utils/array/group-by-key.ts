import type { Maybe } from '@proton/pass/types';

export const groupByKey = <T extends { [key: string]: any }, K extends keyof T>(
    list: T[],
    key: K | ((entry: T) => Maybe<string>),
    options?: { splitEmpty: boolean }
): T[][] => {
    const emptyKey = Symbol();

    const groups = list.reduce((acc: Record<string | symbol, T[]>, entry) => {
        const noKey = options?.splitEmpty ? Symbol() : emptyKey;
        const entryKey = typeof key === 'function' ? key(entry) || noKey : entry[key] || noKey;

        if (!acc[entryKey]) acc[entryKey] = [entry];
        else acc[entryKey].push(entry);

        return acc;
    }, {});

    return Reflect.ownKeys(groups).map((key) => groups[key]);
};

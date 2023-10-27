export const groupByKey = <T extends { [key: string]: any }, K extends keyof T>(
    list: T[],
    key: K,
    options?: { splitEmpty: boolean }
): T[][] => {
    const emptyKey = Symbol();

    const groups = list.reduce((acc: Record<string | symbol, T[]>, entry) => {
        const entryKey = entry[key] ?? (options?.splitEmpty ? Symbol() : emptyKey);

        if (!acc[entryKey]) acc[entryKey] = [entry];
        else acc[entryKey].push(entry);

        return acc;
    }, {});

    return Reflect.ownKeys(groups).map((key) => groups[key]);
};

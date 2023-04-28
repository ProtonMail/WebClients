export const objectMap =
    <Obj extends { [key: string]: any }>(obj: Obj) =>
    <R extends any>(map: (key: keyof Obj, value: Obj[keyof Obj]) => R) => {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, map(key, value)])) as {
            [K in keyof Obj]: R;
        };
    };

export const entriesMap =
    <K extends string, T extends any>(entries: [K, T][]) =>
    <R extends any>(map: (value: T) => R): [K, R][] =>
        entries.map(([key, value]) => [key, map(value)]);

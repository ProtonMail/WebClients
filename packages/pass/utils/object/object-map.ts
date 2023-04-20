export const objectMap =
    <Obj extends { [key: string]: any }>(obj: Obj) =>
    <R extends any>(map: (key: keyof Obj, value: Obj[keyof Obj]) => R) => {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, map(key, value)])) as {
            [K in keyof Obj]: R;
        };
    };

// Inspired by '@proton/pass/utils/object'

export const identityK = <T>(k: string, _: T): string => k;
export const identityV = <T>(_: string, v: T): T => v;

export const objectMapKV = <Obj extends { [key: string]: any }, R extends any>(
    obj: Obj,
    mapV: (key: keyof Obj, value: Obj[keyof Obj]) => R,
    mapK?: (key: keyof Obj, value: Obj[keyof Obj]) => string
) => {
    return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [(mapK ?? identityK)(key, value), mapV(key, value)])
    ) as {
        [K in keyof Obj]: R;
    };
};

export const objectMapV = <Obj extends { [key: string]: any }, R extends any>(
    obj: Obj,
    map: (value: Obj[keyof Obj]) => R
) => {
    return objectMapKV(obj, (_, value) => map(value));
};

export const objectFilterKV = <T, Obj extends { [key: string]: T }>(
    obj: Obj,
    filter: (key: string, value: T) => boolean,
    empty?: Obj
): Obj => {
    const entries = Object.entries(obj);
    if (entries.length === 0) return empty ?? ({} as Obj);
    const filtered = entries.filter(([key, value]) => filter(key, value));
    if (filtered.length === 0) return empty ?? ({} as Obj);
    return Object.fromEntries(filtered) as Obj;
};

export const objectFilterV = <T, Obj extends { [key: string]: T }>(
    obj: Obj,
    filter: (value: T) => boolean,
    empty?: Obj
): Obj => objectFilterKV(obj, (_, value: T) => filter(value), empty);

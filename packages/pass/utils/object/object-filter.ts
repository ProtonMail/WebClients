export const objectFilter = <Obj extends { [key: string]: any }>(
    obj: Obj,
    filter: (key: string, value: Obj[keyof Obj]) => boolean
) => Object.fromEntries(Object.entries(obj).filter(([key, value]) => filter(key, value))) as Obj;

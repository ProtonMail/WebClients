export const objectKeys = <T extends string>(obj: Partial<Record<T, any>>): T[] => Object.keys(obj) as T[];
export const objectEntries = <T extends keyof any, V>(obj: Record<T, V>) => Object.entries(obj) as [T, V][];

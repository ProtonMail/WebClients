export const objectKeys = <K extends string>(obj: Partial<Record<K, any>>): K[] => Object.keys(obj) as K[];
export const objectEntries = <K extends keyof any, V>(obj: Record<K, V>) => Object.entries(obj) as [K, V][];

export const objectKeys = <T extends string>(obj: Partial<Record<T, any>>): T[] => Object.keys(obj) as T[];

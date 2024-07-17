export const isArrayOfType = <T>(value: any, predicate: (item: any) => item is T): value is T[] =>
    Array.isArray(value) && value.length > 0 && value.some(predicate);

export const isEqual = (a: Set<any>, b: Set<any>): boolean => a.size === b.size && [...a].every((x) => b.has(x));

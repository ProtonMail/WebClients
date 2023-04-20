export const arrayReplace = <T>(array: T[], index: number, item: T): T[] => [
    ...array.slice(0, index),
    item,
    ...array.slice(index + 1),
];

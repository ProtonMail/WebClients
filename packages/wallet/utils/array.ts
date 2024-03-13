export const replaceAt = <T>(array: T[], index: number, item: T) => {
    return index > -1 ? [...array.slice(0, index), item, ...array.slice(index + 1, array.length)] : array;
};

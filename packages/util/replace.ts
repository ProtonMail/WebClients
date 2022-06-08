/**
 * Replace the first occurrence of an item from an array by another item. Return a copy of the updated array
 */
export default <T>(arr: T[], item: T, replacement: T) => {
    const i = arr.indexOf(item);
    if (i === -1) {
        return arr;
    }
    const result = arr.slice();
    result.splice(i, 1, replacement);
    return result;
};

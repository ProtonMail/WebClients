/**
 * Remove the first occurrence of an item from an array. Return a copy of the updated array
 */
const remove = <T>(arr: T[], item: T) => {
    const i = arr.indexOf(item);
    if (i === -1) {
        return arr;
    }
    const result = arr.slice();
    result.splice(i, 1);
    return result;
};

export default remove;

/**
 * Divide an array into sub-arrays of a fixed chunk size
 */
const chunk = <T>(list: T[] = [], size = 1) => {
    return list.reduce<T[][]>((res, item, index) => {
        if (index % size === 0) {
            res.push([]);
        }
        res[res.length - 1].push(item);
        return res;
    }, []);
};

export default chunk;

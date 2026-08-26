/**
 * Build an array with a numeric range, specified by a start, an end, and a step
 */
const range = (start = 0, end = 1, step = 1) => {
    const result = [];
    for (let index = start; index < end; index += step) {
        result.push(index);
    }
    return result;
};

export default range;

export const range = (start = 0, end = 0, step = 1) => {
    const result = [];

    for (let index = start; index < end; index += step) {
        result.push(index);
    }

    return result;
};

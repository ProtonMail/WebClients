export const range = (start, end) => {
    const result = [];
    for (let index = start; index < end; index++) {
        result.push(index);
    }
    return result;
};

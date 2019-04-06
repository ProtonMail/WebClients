export const range = (start = 0, end = 0, step = 1) => {
    const result = [];

    for (let index = start; index < end; index += step) {
        result.push(index);
    }

    return result;
};

export const chunk = (list = [], size = 1) => {
    return list.reduce((res, item, index) => {
        if (index % size === 0) {
            res.push([]);
        }
        res[res.length - 1].push(item);
        return res;
    }, []);
};

export const compare = (a, b) => {
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
};

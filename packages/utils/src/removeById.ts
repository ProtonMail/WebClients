export const removeById = <T, K extends keyof T>(list: T[], value: Pick<T, K>, key: K): T[] => {
    const index = list.findIndex((otherValue) => otherValue[key] === value[key]);
    if (index === -1) {
        return list;
    }
    return list.toSpliced(index, 1);
};

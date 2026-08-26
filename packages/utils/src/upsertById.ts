export const upsertById = <T, K extends keyof T>(list: T[], value: T, key: K): T[] => {
    const index = list.findIndex((item) => item[key] === value[key]);

    if (index === -1) {
        return [...list, value];
    }

    return list.with(index, value);
};

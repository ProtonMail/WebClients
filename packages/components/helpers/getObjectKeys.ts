export const getObjectKeys = <T>(obj: T | undefined): (keyof T)[] => {
    return Object.keys(obj || {}) as (keyof T)[];
};

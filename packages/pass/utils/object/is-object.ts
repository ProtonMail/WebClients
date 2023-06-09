export const isObject = (value: any): value is object => {
    return typeof value === 'object' && !Array.isArray(value) && value !== null;
};

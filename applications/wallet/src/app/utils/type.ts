export const isUndefined = <T>(v: T | undefined): v is undefined => {
    return v === undefined;
};

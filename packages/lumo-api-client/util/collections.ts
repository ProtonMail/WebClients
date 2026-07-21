export const when = <T, U extends T[] | Record<string, T>>(condition: boolean, data: U): U => {
    if (condition) {
        return data;
    }
    return (Array.isArray(data) ? [] : {}) as unknown as U;
};

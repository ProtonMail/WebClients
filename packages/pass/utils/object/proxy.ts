export const createMutableProxy = <T extends object>(getter: () => T) =>
    new Proxy<T>(<T>{}, {
        get(_, prop) {
            return getter()[prop as keyof T];
        },
    });

export const safeCall =
    <T extends (...args: any[]) => any>(fn?: T) =>
    (...args: Parameters<T>) => {
        try {
            fn?.(...args);
        } catch (_) {}
    };

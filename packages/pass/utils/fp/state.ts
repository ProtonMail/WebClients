export const updateMap =
    <T extends Map<any, any>>(update: (next: T) => void) =>
    (prev: T) => {
        const next = new Map(prev) as T;
        update(next);
        return next;
    };

export const updateSet =
    <T extends Set<any>>(update: (next: T) => void) =>
    (prev: T) => {
        const next = new Set(prev) as T;
        update(next);
        return next;
    };

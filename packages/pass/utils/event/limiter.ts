type EventLimiterItem = { count: number; start: number };
type EventLimiterState = Map<string, EventLimiterItem>;

export const createEventLimiter = (windowMax: number, windowMs: number) => {
    const state: EventLimiterState = new Map();

    const getItem = (key: string): EventLimiterItem => {
        let item = state.get(key);

        if (item) return item;
        else {
            item = { count: 0, start: Date.now() };
            state.set(key, item);
        }

        return item;
    };

    const reset = (key: string = '*') => {
        const item = state.get(key);

        if (item) {
            item.count = 0;
            item.start = Date.now();
        }
    };

    return {
        allowMessage: (key: string = '*') => {
            const item = getItem(key);
            const now = Date.now();

            if (now - item.start >= windowMs) reset(key);
            if (item.count >= windowMax) return false;

            item.count += 1;
            return true;
        },

        reset,
    };
};

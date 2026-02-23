type EventLimiterItem = { count: number; start: number };
type EventLimiterState = Map<string, EventLimiterItem>;
type EventLimiterOptions = { windowMax: number; windowMs: number };

export const createEventLimiter = ({ windowMax, windowMs }: EventLimiterOptions) => {
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
        allowMessage: (key: string = '*', override?: Partial<EventLimiterOptions>) => {
            const item = getItem(key);
            const now = Date.now();

            if (now - item.start >= (override?.windowMs ?? windowMs)) reset(key);
            if (item.count >= (override?.windowMax ?? windowMax)) return false;

            item.count += 1;
            return true;
        },

        reset,
    };
};

import createIntervalTree from '@protontech/interval-tree';

import type { CalendarEventsCache } from '../interface';

const getCalendarEventsCache = (): CalendarEventsCache => {
    return {
        events: new Map(),
        recurringEvents: new Map(),
        tree: createIntervalTree(),
        fetchCache: new Map(),
        fetchUidCache: new Map(),
        fetchTree: createIntervalTree(),
    };
};

export default getCalendarEventsCache;

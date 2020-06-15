import createIntervalTree from 'interval-tree';
import { CalendarEventCache } from '../interface';

const getCalendarEventCache = (): CalendarEventCache => {
    return {
        events: new Map(),
        recurringEvents: new Map(),
        tree: createIntervalTree(),
        fetchCache: new Map(),
        fetchUidCache: new Map(),
        fetchTree: createIntervalTree(),
    };
};

export default getCalendarEventCache;

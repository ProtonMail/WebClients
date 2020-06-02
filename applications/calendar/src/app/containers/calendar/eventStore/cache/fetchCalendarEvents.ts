import { generateUID } from 'proton-shared/lib/calendar/helper';
import { Api } from 'proton-shared/lib/interfaces';
import { CalendarEventCache } from '../interface';
import getPaginatedEvents from '../getPaginatedEvents';
import upsertCalendarApiEvent from './upsertCalendarApiEvent';

const getIsContained = (range: [Date, Date], otherRange: [Date, Date]) => {
    return otherRange && +otherRange[1] >= +range[1] && +otherRange[0] <= +range[0];
};

export const getExistingFetch = (dateRange: [Date, Date], { fetchTree, fetchCache }: CalendarEventCache) => {
    const existingFetches = fetchTree.search(+dateRange[0], +dateRange[1]).map(([, , id]) => fetchCache.get(id));

    return existingFetches.find((otherFetch) => {
        return otherFetch && getIsContained(dateRange, otherFetch.dateRange);
    });
};

export const fetchCalendarEvents = (
    dateRange: [Date, Date],
    calendarEventCache: CalendarEventCache,
    api: Api,
    calendarID: string,
    tzid: string
) => {
    const existingFetch = getExistingFetch(dateRange, calendarEventCache);

    const { fetchCache, fetchTree } = calendarEventCache;

    if (!existingFetch) {
        const fetchId = generateUID();
        const promise = getPaginatedEvents(api, calendarID, dateRange, tzid)
            .then((Events) => {
                if (fetchCache.get(fetchId)?.promise !== promise) {
                    return;
                }
                Events.forEach((Event) => {
                    upsertCalendarApiEvent(Event, calendarEventCache);
                });
                fetchCache.set(fetchId, { dateRange });
            })
            .catch((error) => {
                if (fetchCache.get(fetchId)?.promise !== promise) {
                    throw error;
                }
                fetchTree.remove(+dateRange[0], +dateRange[1], fetchId);
                fetchCache.delete(fetchId);
                throw error;
            });
        fetchTree.insert(+dateRange[0], +dateRange[1], fetchId);
        fetchCache.set(fetchId, { dateRange, promise });
        return promise;
    }

    return existingFetch.promise;
};

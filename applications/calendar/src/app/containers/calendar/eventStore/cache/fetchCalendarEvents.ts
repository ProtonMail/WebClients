import { generateProtonCalendarUID } from '@proton/shared/lib/calendar/helper';
import { Api } from '@proton/shared/lib/interfaces';

import getPaginatedEvents from '../getPaginatedEvents';
import { CalendarEventsCache } from '../interface';
import upsertCalendarApiEventWithoutBlob from './upsertCalendarApiEventWithoutBlobs';

const getIsContained = (range: [Date, Date], otherRange: [Date, Date]) => {
    return otherRange && +otherRange[1] >= +range[1] && +otherRange[0] <= +range[0];
};

export const getExistingFetch = (dateRange: [Date, Date], { fetchTree, fetchCache }: CalendarEventsCache) => {
    const existingFetches = fetchTree.search(+dateRange[0], +dateRange[1]).map(([, , id]) => fetchCache.get(id));

    return existingFetches.find((otherFetch) => {
        return otherFetch && getIsContained(dateRange, otherFetch.dateRange);
    });
};

export const fetchCalendarEvents = (
    dateRange: [Date, Date],
    calendarEventsCache: CalendarEventsCache,
    api: Api,
    calendarID: string,
    tzid: string,
    noFetch: boolean
) => {
    const existingFetch = getExistingFetch(dateRange, calendarEventsCache);

    const { fetchCache, fetchTree } = calendarEventsCache;

    if (!existingFetch) {
        const fetchId = generateProtonCalendarUID();
        const getEventsPromise = noFetch
            ? Promise.resolve([])
            : getPaginatedEvents(api, calendarID, dateRange, tzid, (Event) =>
                  upsertCalendarApiEventWithoutBlob(Event, calendarEventsCache)
              );
        const promise = getEventsPromise
            .then(() => {
                if (fetchCache.get(fetchId)?.promise !== promise) {
                    return;
                }
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

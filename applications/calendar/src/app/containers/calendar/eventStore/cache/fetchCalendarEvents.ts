import { generateProtonCalendarUID } from '@proton/shared/lib/calendar/helper';
import { Api } from '@proton/shared/lib/interfaces';
import { CalendarEvent, CalendarEventWithoutBlob } from '@proton/shared/lib/interfaces/calendar';

import { OpenedMailEvent } from '../../../../hooks/useGetOpenedMailEvents';
import { getPaginatedCalendarEvents, getPaginatedCalendarEventsWithoutBlob } from '../getPaginatedEvents';
import { CalendarEventsCache } from '../interface';
import upsertCalendarApiEvent from './upsertCalendarApiEvent';
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

export const fetchCalendarEvents = ({
    calendarID,
    dateRange,
    tzid,
    calendarEventsCache,
    noFetch,
    getOpenedMailEvents,
    metadataOnly,
    api,
}: {
    calendarID: string;
    dateRange: [Date, Date];
    tzid: string;
    calendarEventsCache: CalendarEventsCache;
    getOpenedMailEvents: () => OpenedMailEvent[];
    noFetch: boolean;
    metadataOnly?: boolean;
    api: Api;
}) => {
    const existingFetch = getExistingFetch(dateRange, calendarEventsCache);

    const { fetchCache, fetchTree } = calendarEventsCache;

    if (!existingFetch) {
        const fetchId = generateProtonCalendarUID();
        const getEventsPromise = (() => {
            if (noFetch) {
                return Promise.resolve([]);
            }
            if (metadataOnly) {
                return getPaginatedCalendarEventsWithoutBlob({
                    calendarID,
                    dateRange,
                    tzid,
                    api,
                    upsertEvent: (event: CalendarEventWithoutBlob) =>
                        upsertCalendarApiEventWithoutBlob(event, calendarEventsCache),
                });
            }
            return getPaginatedCalendarEvents({
                calendarID,
                dateRange,
                tzid,
                api,
                upsertEvent: (event: CalendarEvent) =>
                    upsertCalendarApiEvent(event, calendarEventsCache, getOpenedMailEvents),
            });
        })();
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

import { Api } from '@proton/shared/lib/interfaces';

import { CalendarAlarmCache } from './CacheInterface';
import getPaginatedAlarms from './getPaginatedAlarms';

const getCalendarsAlarmsCached = (api: Api, cache: CalendarAlarmCache, calendarIDs: string[], dateRange: Date[]) => {
    const promises = calendarIDs.map((calendarID) => {
        if (cache[calendarID] && cache[calendarID].promise) {
            return cache[calendarID].promise;
        }
        if (cache[calendarID] && cache[calendarID].result) {
            return;
        }

        const promise = getPaginatedAlarms(api, calendarID, dateRange)
            .then((result) => {
                cache[calendarID] = {
                    result,
                };
            })
            .catch(() => {
                delete cache[calendarID];
            });

        cache[calendarID] = {
            promise,
        };

        return promise;
    });
    return Promise.all(promises);
};

export default getCalendarsAlarmsCached;

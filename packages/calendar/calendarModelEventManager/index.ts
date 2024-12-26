import { queryLatestModelEventID, queryModelEvents } from '@proton/shared/lib/api/calendars';
import createEventManager, { EVENT_ID_KEYS, type EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { Api, SimpleMap } from '@proton/shared/lib/interfaces';

type SubscribeCallback = (data: any) => void;

export interface CalendarModelEventManager {
    start: (calendarIDs: string[]) => void[];
    stop: (calendarIDs: string[]) => void[];
    reset: (calendarIDs: string[]) => void[];
    call: (calendarIDs: string[]) => Promise<void[]>;
    subscribe: (calendarIDs: string[], cb: SubscribeCallback) => () => void;
    clear: () => void;
}

const createCalendarEventManagerById = (api: Api, calendarID: string) => {
    const eventManager = createEventManager({
        api,
        getLatestEventID: ({ api, ...rest }) =>
            api<{
                CalendarModelEventID: string;
            }>({ ...queryLatestModelEventID(calendarID), ...rest }).then(
                ({ CalendarModelEventID }) => CalendarModelEventID
            ),
        eventIDKey: EVENT_ID_KEYS.CALENDAR,
        query: (eventId: string) => queryModelEvents(calendarID, eventId),
    });
    eventManager.start();
    return eventManager;
};

const getOrSetRecord = (calendarID: string, eventManagers: SimpleMap<EventManagerCacheRecord>, api: Api) => {
    const cachedValue = eventManagers[calendarID];
    if (!cachedValue) {
        eventManagers[calendarID] = createCalendarEventManagerById(api, calendarID);
    }
    return cachedValue;
};

type EventManagerCacheRecord = EventManager;

export const createCalendarModelEventManager = ({ api }: { api: Api }): CalendarModelEventManager => {
    let eventManagers: SimpleMap<EventManagerCacheRecord> = {};

    const clear = () => {
        Object.values(eventManagers).forEach((eventManager) => {
            if (!eventManager) {
                return;
            }
            eventManager.stop();
            eventManager.reset();
        });
        eventManagers = {};
    };

    const start = (calendarIDs: string[]) => {
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.start();
        });
    };

    const stop = (calendarIDs: string[]) => {
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.stop();
        });
    };

    const reset = (calendarIDs: string[]) => {
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.reset();
        });
    };

    const call = (calendarIDs: string[]) => {
        return Promise.all(
            calendarIDs.map((calendarID) => {
                return eventManagers[calendarID]?.call();
            })
        );
    };

    const subscribe = (calendarIDs: string[], cb: SubscribeCallback) => {
        let isActive = true;
        const notify = (data: any) => {
            cb(data);
        };

        const unsubscribes = calendarIDs.reduce<(() => void)[]>((acc, calendarID) => {
            const eventManager = getOrSetRecord(calendarID, eventManagers, api);
            if (!isActive || !eventManager) {
                return acc;
            }
            acc.push(eventManager.subscribe(notify));
            return acc;
        }, []);

        return () => {
            unsubscribes.forEach((unsub) => unsub?.());
            isActive = false;
        };
    };

    return {
        start,
        stop,
        reset,
        call,
        subscribe,
        clear,
    };
};

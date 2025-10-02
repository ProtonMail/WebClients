import { queryLatestModelEventID, queryModelEvents } from '@proton/shared/lib/api/calendars';
import createEventManager, { type EventManager } from '@proton/shared/lib/eventManager/eventManager';
import type { Api, SimpleMap } from '@proton/shared/lib/interfaces';

import type { CalendarEventLoop } from '../calendarServerEvent';

type SubscribeCallback = (data: CalendarEventLoop) => void;

export interface CalendarModelEventManager {
    start: (calendarIDs: string[]) => void;
    stop: (calendarIDs: string[]) => void;
    reset: (calendarIDs: string[]) => void;
    call: (calendarIDs: string[]) => Promise<void[]>;
    subscribe: (calendarIDs: string[], cb: SubscribeCallback) => () => void;
    clear: () => void;
}

const createCalendarEventManagerById = (api: Api, calendarID: string) => {
    const eventManager = createEventManager<CalendarEventLoop>({
        getLatestEventID: (options) => {
            return api<{
                CalendarModelEventID: string;
            }>({ ...queryLatestModelEventID(calendarID), ...options }).then(
                ({ CalendarModelEventID }) => CalendarModelEventID
            );
        },
        getEvents: ({ eventID, ...rest }) => {
            return api<CalendarEventLoop>({ ...queryModelEvents(calendarID, eventID), ...rest });
        },
        parseResults: (result) => ({ nextEventID: result.CalendarModelEventID, more: result.More }),
    });
    eventManager.start();
    return eventManager;
};

const getOrSetRecord = (calendarID: string, eventManagers: SimpleMap<EventManagerCacheRecord>, api: Api) => {
    let value = eventManagers[calendarID];
    if (!value) {
        value = createCalendarEventManagerById(api, calendarID);
        eventManagers[calendarID] = value;
    }
    return value;
};

type EventManagerCacheRecord = EventManager<any>;

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
        calendarIDs.forEach((calendarID) => {
            eventManagers[calendarID]?.start();
        });
    };

    const stop = (calendarIDs: string[]) => {
        calendarIDs.forEach((calendarID) => {
            eventManagers[calendarID]?.stop();
        });
    };

    const reset = (calendarIDs: string[]) => {
        calendarIDs.forEach((calendarID) => {
            eventManagers[calendarID]?.reset();
            delete eventManagers[calendarID];
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
        const notify = (data: any) => {
            cb(data);
        };

        const unsubscribes = calendarIDs.reduce<(() => void)[]>((acc, calendarID) => {
            const eventManager = getOrSetRecord(calendarID, eventManagers, api);
            acc.push(eventManager.subscribe(notify));
            return acc;
        }, []);

        return () => {
            unsubscribes.forEach((unsub) => unsub());
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

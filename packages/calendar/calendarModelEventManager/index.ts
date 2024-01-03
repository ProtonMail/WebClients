import { queryLatestModelEventID, queryModelEvents } from '@proton/shared/lib/api/calendars';
import createEventManager, { EVENT_ID_KEYS, EventManager } from '@proton/shared/lib/eventManager/eventManager';
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

const createCalendarEventManagerById = async (api: Api, calendarID: string) => {
    const { CalendarModelEventID } = await api<{ CalendarModelEventID: string }>(queryLatestModelEventID(calendarID));
    const eventManager = createEventManager({
        api,
        eventID: CalendarModelEventID,
        query: (eventId: string) => queryModelEvents(calendarID, eventId),
        eventIDKey: EVENT_ID_KEYS.CALENDAR,
    });
    eventManager.start();
    return eventManager;
};

const getOrSetRecord = (calendarID: string, eventManagers: SimpleMap<EventManagerCacheRecord>, api: Api) => {
    const cachedValue = eventManagers[calendarID];
    if (!cachedValue || (cachedValue.eventManager === undefined && cachedValue.promise === undefined)) {
        const promise = createCalendarEventManagerById(api, calendarID)
            .then((eventManager) => {
                eventManagers[calendarID] = {
                    eventManager,
                    promise: undefined,
                };
                return eventManager;
            })
            .catch(() => {
                delete eventManagers[calendarID];
                return undefined;
            });
        const record = { promise, eventManager: undefined };
        eventManagers[calendarID] = record;
        return record;
    }
    return cachedValue;
};

type EventManagerCacheRecord =
    | {
          eventManager: EventManager;
          promise: undefined;
      }
    | {
          promise: Promise<EventManager | undefined>;
          eventManager: undefined;
      };

export const createCalendarModelEventManager = ({ api }: { api: Api }): CalendarModelEventManager => {
    let eventManagers: SimpleMap<EventManagerCacheRecord> = {};

    const clear = () => {
        Object.values(eventManagers).forEach((record) => {
            if (!record) {
                return;
            }
            if (record.promise) {
                record.promise.then((eventManager) => {
                    if (!eventManager) {
                        return;
                    }
                    eventManager.stop();
                    eventManager.reset();
                });
            }
            if (record.eventManager) {
                record.eventManager.stop();
                record.eventManager.reset();
            }
        });
        eventManagers = {};
    };

    const start = (calendarIDs: string[]) => {
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.eventManager?.start();
        });
    };

    const stop = (calendarIDs: string[]) => {
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.eventManager?.stop();
        });
    };

    const reset = (calendarIDs: string[]) => {
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.eventManager?.reset();
        });
    };

    const call = (calendarIDs: string[]) => {
        return Promise.all(
            calendarIDs.map((calendarID) => {
                return eventManagers[calendarID]?.eventManager?.call();
            })
        );
    };

    const subscribe = (calendarIDs: string[], cb: SubscribeCallback) => {
        let isActive = true;
        const notify = (data: any) => {
            cb(data);
        };

        const unsubscribes = calendarIDs.reduce<(() => void)[]>((acc, calendarID) => {
            const record = getOrSetRecord(calendarID, eventManagers, api);
            if (record.promise) {
                record.promise.then((eventManager) => {
                    if (!isActive || !eventManager) {
                        return;
                    }
                    acc.push(eventManager.subscribe(notify));
                });
                return acc;
            }
            acc.push(record.eventManager.subscribe(notify));
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

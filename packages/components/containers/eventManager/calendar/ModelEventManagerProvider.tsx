import React, { createContext, useContext, useEffect, useRef } from 'react';
import { queryLatestModelEventID, queryModelEvents } from '@proton/shared/lib/api/calendars';
import createEventManager, { EVENT_ID_KEYS, EventManager } from '@proton/shared/lib/eventManager/eventManager';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { Api } from '@proton/shared/lib/interfaces';
import { useApi } from '../../../hooks';

const CalendarModelEventManagerContext = createContext<CalendarModelEventManager | null>(null);
type SubscribeCallback = (data: any) => void;

export interface CalendarModelEventManager {
    start: (calendarIDs: string[]) => void[];
    stop: (calendarIDs: string[]) => void[];
    reset: (calendarIDs: string[]) => void[];
    call: (calendarIDs: string[]) => Promise<void[]>;
    subscribe: (calendarIDs: string[], cb: SubscribeCallback) => () => void;
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

interface Props {
    children: React.ReactNode;
}

const ModelEventManagerProvider = ({ children }: Props) => {
    const api = useApi();
    const silentApi: <T>(config: object) => Promise<T> = (config) => api({ ...config, silence: true });
    const eventManagersByIdRef = useRef<SimpleMap<EventManagerCacheRecord>>({});

    useEffect(() => {
        return () => {
            const eventManagers = eventManagersByIdRef.current;
            eventManagersByIdRef.current = {};
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
        };
    }, []);

    const start = (calendarIDs: string[]) => {
        const eventManagers = eventManagersByIdRef.current;
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.eventManager?.start();
        });
    };

    const stop = (calendarIDs: string[]) => {
        const eventManagers = eventManagersByIdRef.current;
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.eventManager?.stop();
        });
    };

    const reset = (calendarIDs: string[]) => {
        const eventManagers = eventManagersByIdRef.current;
        return calendarIDs.map((calendarID) => {
            return eventManagers[calendarID]?.eventManager?.reset();
        });
    };

    const call = (calendarIDs: string[]) => {
        const eventManagers = eventManagersByIdRef.current;
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
            const record = getOrSetRecord(calendarID, eventManagersByIdRef.current, silentApi);
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

    const calendarsEventManager: CalendarModelEventManager = {
        start,
        stop,
        reset,
        call,
        subscribe,
    };

    return (
        <CalendarModelEventManagerContext.Provider value={calendarsEventManager}>
            {children}
        </CalendarModelEventManagerContext.Provider>
    );
};

export const useCalendarModelEventManager = () => {
    const state = useContext(CalendarModelEventManagerContext);
    if (!state) {
        throw new Error('Trying to use uninitialized ModelEventManagerProvider');
    }
    return state;
};

export default ModelEventManagerProvider;

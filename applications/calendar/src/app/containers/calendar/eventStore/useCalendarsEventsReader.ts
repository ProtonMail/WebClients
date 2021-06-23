import { pick } from 'proton-shared/lib/helpers/object';
import { MutableRefObject, useEffect, useRef, useState } from 'react';
import useGetCalendarEventPersonal from 'react-components/hooks/useGetCalendarEventPersonal';
import { useApi, useGetCalendarEventRaw } from 'react-components';
import { wait } from 'proton-shared/lib/helpers/promise';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { getEvent as getEventRoute } from 'proton-shared/lib/api/calendars';
import { c } from 'ttag';

import upsertCalendarApiEvent from './cache/upsertCalendarApiEvent';
import { getIsCalendarEvent } from './cache/helper';
import { CalendarViewEvent } from '../interface';
import {
    CalendarEventsCache,
    CalendarsEventsCache,
    DecryptedEventTupleResult,
    SharedVcalVeventComponent,
} from './interface';
import getAllEventsByUID from '../getAllEventsByUID';

const SLOW_EVENT_BYPASS = {};
const EVENTS_PER_BATCH = 5;
const EVENTS_RACE_MS = 300;

const useCalendarsEventsReader = (
    calendarEvents: CalendarViewEvent[],
    cacheRef: MutableRefObject<CalendarsEventsCache>,
    rerender: () => void
) => {
    const getCalendarEventPersonal = useGetCalendarEventPersonal();
    const getCalendarEventRaw = useGetCalendarEventRaw();
    const api = useApi();
    const [loading, setLoading] = useState(false);
    const abortControllerRef = useRef<AbortController>();

    useEffect(() => {
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        return () => {
            abortController.abort();
        };
    }, []);

    useEffect(() => {
        const signal = abortControllerRef.current?.signal;
        if (!signal) {
            throw new Error('Required variables');
        }

        const getEventAndUpsert = async (
            calendarID: string,
            eventID: string,
            calendarEventsCache: CalendarEventsCache
        ): Promise<void> => {
            try {
                const { Event } = await api<{ Event: CalendarEvent }>({
                    ...getEventRoute(calendarID, eventID),
                    silence: true,
                    signal,
                });
                upsertCalendarApiEvent(Event, calendarEventsCache);
            } catch (error) {
                throw new Error('Failed to get event');
            }
        };

        const getDecryptedEvent = (eventData: CalendarEvent): Promise<DecryptedEventTupleResult> => {
            return Promise.all([
                getCalendarEventRaw(eventData),
                getCalendarEventPersonal(eventData),
                pick(eventData, ['Permissions', 'IsOrganizer']),
            ]);
        };

        // Single edits are not always tied to the parent. Ensure that if the parent exists, it's in the cache before viewing it.
        const getRecurringEventAndUpsert = (
            eventComponent: SharedVcalVeventComponent,
            eventData: CalendarEvent,
            calendarEventsCache: CalendarEventsCache
        ): Promise<void> | undefined => {
            if (!eventComponent['recurrence-id'] || !eventComponent.uid) {
                return;
            }

            const cache = cacheRef.current;
            const uid = eventComponent.uid.value;
            const calendarID = eventData.CalendarID;

            const getParentEvent = () => {
                const recurringEventsCache = cache.getCachedRecurringEvent(calendarID, uid);
                const parentEventID = recurringEventsCache?.parentEventID;
                if (!parentEventID) {
                    return;
                }
                return cache.getCachedEvent(calendarID, parentEventID);
            };

            if (getParentEvent()) {
                return;
            }

            const oldFetchPromise = calendarEventsCache.fetchUidCache.get(uid);
            if (oldFetchPromise?.promise) {
                return oldFetchPromise.promise;
            }

            const newFetchPromise = getAllEventsByUID(api, calendarID, uid)
                .then((eventOccurrences) => {
                    eventOccurrences.forEach((eventOccurrence) => {
                        upsertCalendarApiEvent(eventOccurrence, calendarEventsCache);
                    });
                })
                .catch(() => {
                    throw new Error(c('Error').t`Failed to get original occurrence in series`);
                });
            calendarEventsCache.fetchUidCache.set(uid, { promise: newFetchPromise });
            return newFetchPromise;
        };

        const seen = new Set();

        const calendarEventPromises = calendarEvents.reduce<Promise<void>[]>((acc, calendarViewEvent) => {
            if (acc.length === EVENTS_PER_BATCH) {
                return acc;
            }

            const { calendarData, eventData } = calendarViewEvent.data;
            const calendarEventsCache = cacheRef.current?.calendars[calendarData.ID];
            const eventRecord = calendarEventsCache?.events.get(eventData?.ID || 'undefined');
            if (!calendarEventsCache || !eventRecord || eventRecord.eventReadResult || seen.has(eventRecord)) {
                return acc;
            }

            // To ignore recurring events
            seen.add(eventRecord);

            if (!eventRecord.eventData) {
                eventRecord.eventReadResult = { error: new Error('Unknown process') };
                return acc;
            }

            if (!eventRecord.eventPromise) {
                let promise;
                if (getIsCalendarEvent(eventRecord.eventData)) {
                    promise = Promise.all([
                        getDecryptedEvent(eventRecord.eventData),
                        getRecurringEventAndUpsert(
                            eventRecord.eventComponent,
                            eventRecord.eventData,
                            calendarEventsCache
                        ),
                    ]).then(([eventDecrypted]) => {
                        return eventDecrypted;
                    });
                } else {
                    promise = getEventAndUpsert(calendarData.ID, eventRecord.eventData.ID, calendarEventsCache).then(
                        () => {
                            // Relies on a re-render happening which would make this error never show up
                            throw new Error('Outdated event');
                        }
                    );
                }
                eventRecord.eventPromise = promise
                    .then((result) => {
                        eventRecord.eventReadResult = { result };
                        eventRecord.eventPromise = undefined;
                    })
                    .catch((error) => {
                        eventRecord.eventReadResult = { error };
                        eventRecord.eventPromise = undefined;
                    });
            }
            acc.push(eventRecord.eventPromise);
            return acc;
        }, []);

        if (calendarEventPromises.length === 0) {
            return setLoading(false);
        }

        let isActive = true;
        setLoading(true);
        const done = () => {
            if (isActive) {
                setLoading(false);
                rerender();
            }
        };

        const run = async () => {
            const allCalendarEventPromise = Promise.all(calendarEventPromises);

            // The first one to complete. It's mostly intended to avoid api event fetches blocking other actions.
            const raceResult = await Promise.race([
                allCalendarEventPromise,
                wait(EVENTS_RACE_MS).then(() => SLOW_EVENT_BYPASS),
            ]);

            // If the slow event bypass won, set up a handler for when all the events have finished (in case a re-render never happens)
            if (raceResult === SLOW_EVENT_BYPASS) {
                allCalendarEventPromise.then(done, done);
            } else {
                done();
            }
        };

        run().catch(done);

        return () => {
            isActive = false;
        };
    }, [calendarEvents]);

    return loading;
};

export default useCalendarsEventsReader;

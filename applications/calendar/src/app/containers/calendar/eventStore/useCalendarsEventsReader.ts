import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi, useGetCalendarEventRaw } from '@proton/components';
import useGetCalendarEventPersonal from '@proton/components/hooks/useGetCalendarEventPersonal';
import { getEvent as getEventRoute } from '@proton/shared/lib/api/calendars';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { pick } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { Api, RequireSome } from '@proton/shared/lib/interfaces';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { GetCalendarEventPersonal } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventPersonal';
import { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import getAllEventsByUID from '../getAllEventsByUID';
import { CalendarViewEvent } from '../interface';
import { getIsCalendarEvent } from './cache/helper';
import upsertCalendarApiEvent from './cache/upsertCalendarApiEvent';
import {
    CalendarEventStoreRecord,
    CalendarEventsCache,
    CalendarsEventsCache,
    DecryptedEventTupleResult,
    SharedVcalVeventComponent,
    getEventStoreRecordHasEventData,
} from './interface';

const SLOW_EVENT_BYPASS = {};
const EVENTS_PER_BATCH = 5;
const EVENTS_RACE_MS = 300;

const GET_EVENT_ERROR_MESSAGE = 'Failed to get event';

const getEventAndUpsert = async ({
    calendarID,
    eventID,
    calendarEventsCache,
    api,
    getOpenedMailEvents,
}: {
    calendarID: string;
    eventID: string;
    calendarEventsCache: CalendarEventsCache;
    api: Api;
    getOpenedMailEvents?: () => OpenedMailEvent[];
}): Promise<void> => {
    try {
        const { Event } = await api<{ Event: CalendarEvent }>({
            ...getEventRoute(calendarID, eventID),
            silence: true,
        });
        upsertCalendarApiEvent(Event, calendarEventsCache, getOpenedMailEvents);
    } catch (error: any) {
        throw new Error(GET_EVENT_ERROR_MESSAGE);
    }
};

const getDecryptedEvent = ({
    calendarEvent,
    getCalendarEventRaw,
    getCalendarEventPersonal,
}: {
    calendarEvent: CalendarEvent;
    getCalendarEventRaw: GetCalendarEventRaw;
    getCalendarEventPersonal: GetCalendarEventPersonal;
}): Promise<DecryptedEventTupleResult> => {
    return Promise.all([
        getCalendarEventRaw(calendarEvent),
        getCalendarEventPersonal(calendarEvent),
        pick(calendarEvent, ['Permissions', 'IsOrganizer', 'IsProtonProtonInvite']),
    ]);
};

// Single edits are not always tied to the parent. Ensure that if the parent exists, it's in the cache before viewing it.
const getRecurringEventAndUpsert = ({
    eventComponent,
    calendarEvent,
    cacheRef,
    calendarEventsCache,
    api,
    getOpenedMailEvents,
}: {
    eventComponent: SharedVcalVeventComponent;
    calendarEvent: CalendarEvent;
    cacheRef: MutableRefObject<CalendarsEventsCache>;
    calendarEventsCache: CalendarEventsCache;
    api: Api;
    getOpenedMailEvents?: () => OpenedMailEvent[];
}): Promise<void> | undefined => {
    if (!eventComponent['recurrence-id'] || !eventComponent.uid) {
        return;
    }

    const cache = cacheRef.current;
    const uid = eventComponent.uid.value;
    const calendarID = calendarEvent.CalendarID;

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
                upsertCalendarApiEvent(eventOccurrence, calendarEventsCache, getOpenedMailEvents);
            });
        })
        .catch(() => {
            calendarEventsCache.fetchUidCache.set(uid, { promise: undefined });
            throw new Error(c('Error').t`Failed to get original occurrence in series`);
        });
    calendarEventsCache.fetchUidCache.set(uid, { promise: newFetchPromise });

    return newFetchPromise;
};

const setEventRecordPromise = ({
    eventRecord,
    getCalendarEventRaw,
    getCalendarEventPersonal,
    cacheRef,
    calendarEventsCache,
    api,
    getOpenedMailEvents,
}: {
    eventRecord: RequireSome<CalendarEventStoreRecord, 'eventData'>;
    getCalendarEventRaw: GetCalendarEventRaw;
    getCalendarEventPersonal: GetCalendarEventPersonal;
    cacheRef: MutableRefObject<CalendarsEventsCache>;
    calendarEventsCache: CalendarEventsCache;
    api: Api;
    getOpenedMailEvents?: () => OpenedMailEvent[];
}) => {
    const { eventData: calendarEvent, eventComponent } = eventRecord;

    const onError = (error: any) => {
        const errorMessage = error?.message || 'Unknown error';
        if (!errorMessage.toLowerCase().includes('decrypt')) {
            /**
             * (Temporarily) Log to Sentry any error not related to decryption
             */
            const { ID, CalendarID } = eventRecord.eventData || {};
            captureMessage('Unexpected error reading calendar event', {
                extra: { message: errorMessage, eventID: ID, calendarID: CalendarID },
            });
        }
        eventRecord.eventReadResult = { error };
        eventRecord.eventPromise = undefined;
    };

    if (!getIsCalendarEvent(calendarEvent)) {
        const promise = getEventAndUpsert({
            calendarID: calendarEvent.CalendarID,
            eventID: calendarEvent.ID,
            calendarEventsCache,
            api,
            getOpenedMailEvents,
        })
            .then(() => {
                // getEventAndUpsert is already clearing these. Repeating here for safety
                eventRecord.eventReadResult = undefined;
                eventRecord.eventPromise = undefined;
            })
            .catch(onError);
        eventRecord.eventPromise = promise;

        return promise;
    }

    const promise = Promise.all([
        getDecryptedEvent({
            calendarEvent,
            getCalendarEventRaw,
            getCalendarEventPersonal,
        }),
        getRecurringEventAndUpsert({
            eventComponent: eventComponent,
            calendarEvent,
            cacheRef,
            calendarEventsCache,
            api,
        }),
    ])
        .then(([eventDecrypted]) => {
            return eventDecrypted;
        })
        .then((result) => {
            eventRecord.eventReadResult = { result };
            eventRecord.eventPromise = undefined;
        })
        .catch(onError);
    eventRecord.eventPromise = promise;

    return promise;
};

const useCalendarsEventsReader = (
    calendarEvents: CalendarViewEvent[],
    cacheRef: MutableRefObject<CalendarsEventsCache>,
    rerender: () => void,
    getOpenedMailEvents: () => OpenedMailEvent[]
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
        const apiWithAbort = getApiWithAbort(api, signal);

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

            if (!getEventStoreRecordHasEventData(eventRecord)) {
                eventRecord.eventReadResult = { error: new Error('Unknown process') };
                return acc;
            }

            const getPromise = () =>
                setEventRecordPromise({
                    eventRecord,
                    getCalendarEventRaw,
                    getCalendarEventPersonal,
                    cacheRef,
                    calendarEventsCache,
                    api: apiWithAbort,
                    getOpenedMailEvents,
                });

            if (!eventRecord.eventReadRetry) {
                eventRecord.eventReadRetry = () => getPromise().then(rerender);
            }

            if (!eventRecord.eventPromise) {
                acc.push(getPromise());
            }

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

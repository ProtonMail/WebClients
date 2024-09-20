import type { MutableRefObject } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useApi, useContactEmailsCache, useGetCalendarEventRaw } from '@proton/components';
import useIsMounted from '@proton/hooks/useIsMounted';
import { getEvent as getEventRoute } from '@proton/shared/lib/api/calendars';
import { getApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import { naiveGetIsDecryptionError } from '@proton/shared/lib/calendar/helper';
import { pick } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import type { Api, RequireSome } from '@proton/shared/lib/interfaces';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import type { GetCalendarEventRaw } from '@proton/shared/lib/interfaces/hooks/GetCalendarEventRaw';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import getAllEventsByUID from '../getAllEventsByUID';
import type { CalendarViewEvent } from '../interface';
import { getIsCalendarEvent } from './cache/helper';
import upsertCalendarApiEvent from './cache/upsertCalendarApiEvent';
import type {
    CalendarEventStoreRecord,
    CalendarEventsCache,
    CalendarsEventsCache,
    DecryptedEventTupleResult,
    EventReadResult,
    SharedVcalVeventComponent,
} from './interface';
import { getEventStoreRecordHasEventData } from './interface';
import type { InitRetry } from './useCalendarsEventsRetry';
import useCalendarsEventsRetry from './useCalendarsEventsRetry';

const SLOW_EVENT_BYPASS = {};
const EVENTS_PER_BATCH_OLD = 5;
const EVENTS_PER_BATCH = 200;
const EVENTS_RACE_MS = 300;

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
}): Promise<CalendarEvent> => {
    try {
        const { Event } = await api<{ Event: CalendarEvent }>({
            ...getEventRoute(calendarID, eventID),
            silence: true,
        });
        upsertCalendarApiEvent(Event, calendarEventsCache, getOpenedMailEvents);

        return Event;
    } catch (error: any) {
        throw new Error(c('Error').t`Failed to get event`);
    }
};

const getDecryptedEvent = ({
    calendarEvent,
    getCalendarEventRaw,
}: {
    calendarEvent: CalendarEvent;
    getCalendarEventRaw: GetCalendarEventRaw;
}): Promise<DecryptedEventTupleResult> => {
    return Promise.all([
        getCalendarEventRaw(calendarEvent),
        pick(calendarEvent, ['Permissions', 'IsProtonProtonInvite']),
    ]);
};

// Single edits are not always tied to the parent. Ensure that if the parent exists, it's in the cache before viewing it.
const getRecurringEventAndUpsert = ({
    eventComponent,
    calendarEvent,
    calendarsEventsCacheRef,
    calendarEventsCache,
    api,
    getOpenedMailEvents,
}: {
    eventComponent: SharedVcalVeventComponent;
    calendarEvent: CalendarEvent;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    calendarEventsCache: CalendarEventsCache;
    api: Api;
    getOpenedMailEvents?: () => OpenedMailEvent[];
}): Promise<void> | undefined => {
    if (!eventComponent['recurrence-id'] || !eventComponent.uid) {
        return;
    }

    const cache = calendarsEventsCacheRef.current;
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
    calendarsEventsCacheRef,
    calendarEventsCache,
    api,
    getOpenedMailEvents,
    forceDecryption,
    initRetry,
}: {
    eventRecord: RequireSome<CalendarEventStoreRecord, 'eventData'>;
    getCalendarEventRaw: GetCalendarEventRaw;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    calendarEventsCache: CalendarEventsCache;
    api: Api;
    getOpenedMailEvents?: () => OpenedMailEvent[];
    forceDecryption?: boolean;
    initRetry?: InitRetry;
}): Promise<EventReadResult | undefined> => {
    const { eventData: calendarEvent, eventComponent } = eventRecord;

    const onError = async (error: any) => {
        // trigger auto-retry, but don't wait for it to avoid blocking the UI with a blinking skeleton
        void initRetry?.(calendarEvent.CalendarID, calendarEvent.ID).then((success) => {
            if (success) {
                return;
            }
            const errorMessage = error?.message || 'Unknown error';
            if (!naiveGetIsDecryptionError(error)) {
                /**
                 * (Temporarily) Log to Sentry any error not related to decryption
                 */
                const { ID, CalendarID } = eventRecord.eventData || {};
                captureMessage('Unexpected error reading calendar event', {
                    extra: { message: errorMessage, eventID: ID, calendarID: CalendarID },
                });
            }
        });

        eventRecord.eventReadResult = { error };
        eventRecord.eventPromise = undefined;

        return { error };
    };

    if (!getIsCalendarEvent(calendarEvent)) {
        const promise = getEventAndUpsert({
            calendarID: calendarEvent.CalendarID,
            eventID: calendarEvent.ID,
            calendarEventsCache,
            api,
            getOpenedMailEvents,
        })
            .then((calendarEvent) => {
                // getEventAndUpsert is already clearing these. Repeating here for safety
                eventRecord.eventReadResult = undefined;
                eventRecord.eventPromise = undefined;

                if (forceDecryption) {
                    // we go through a second iteration of setEventRecordPromise, but with a calendarEvent in the record
                    // so that event decryption is forced
                    return setEventRecordPromise({
                        eventRecord: { ...eventRecord, eventData: calendarEvent },
                        getCalendarEventRaw,
                        calendarsEventsCacheRef,
                        calendarEventsCache,
                        api,
                        getOpenedMailEvents,
                        forceDecryption: false,
                        initRetry,
                    });
                }

                return undefined;
            })
            .catch(onError);

        eventRecord.eventPromise = promise;
        return promise;
    }

    const promise = Promise.all([
        getDecryptedEvent({
            calendarEvent,
            getCalendarEventRaw,
        }),
        getRecurringEventAndUpsert({
            eventComponent: eventComponent,
            calendarEvent,
            calendarsEventsCacheRef,
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

            return { result };
        })
        .catch(onError);

    eventRecord.eventPromise = promise;

    return promise;
};

const useCalendarsEventsReader = ({
    calendarEvents,
    calendarsEventsCacheRef,
    rerender,
    getOpenedMailEvents,
    metadataOnly,
    onEventRead,
    forceDecryption,
}: {
    calendarEvents: CalendarViewEvent[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    rerender: () => void;
    getOpenedMailEvents: () => OpenedMailEvent[];
    metadataOnly: boolean;
    onEventRead?: (
        calendarID: string,
        eventID: string,
        {
            calendarViewEvent,
            eventReadResult,
        }: { calendarViewEvent: CalendarViewEvent; eventReadResult: EventReadResult }
    ) => void;
    forceDecryption?: boolean;
}) => {
    const isMounted = useIsMounted();
    const { contactEmailsMap } = useContactEmailsCache();
    const getCalendarEventRaw = useGetCalendarEventRaw(contactEmailsMap);
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

    const { initRetry } = useCalendarsEventsRetry({ calendarsEventsCacheRef });

    useEffect(() => {
        const signal = abortControllerRef.current?.signal;
        if (!signal) {
            throw new Error('Required variables');
        }
        const apiWithAbort = getApiWithAbort(api, signal);

        const seen = new Set();

        const calendarEventPromises = calendarEvents.reduce<Promise<EventReadResult | undefined>[]>(
            (acc, calendarViewEvent) => {
                /**
                 * We're forced to proceed by batches below because, in the case metadataOnly = true, the first iteration
                 * through this reduce loop at app load will have to load event blob data for all events in view.
                 * Without batching that would imply launching N simultaneous requests if you have N events in view.
                 *
                 * It turns out that there's a bug in Chromium (see https://github.com/GoogleChrome/workbox/issues/2528 for
                 * multiple references to it) that causes an exhaustion of the browser resources when launching many simultaneous
                 * HTTP2 requests (not an issue for HTTP1 since in that case simultaneous requests are capped at 6), making
                 * requests over the quota fail with a net:ERR_INSUFFICIENT_RESOURCES error. Only Chromium-based browser have this bug.
                 * The number of max simultaneous requests allowed seems to be variable. There's probably not a hard cap on it,
                 * but rather a cap on the memory that the browser can use. In our tests we saw the error at around ~1000 requests.
                 */
                const eventsPerBatch = metadataOnly ? EVENTS_PER_BATCH : EVENTS_PER_BATCH_OLD;

                if (acc.length === eventsPerBatch) {
                    return acc;
                }

                const { calendarData, eventData } = calendarViewEvent.data;
                const calendarEventsCache = calendarsEventsCacheRef.current?.calendars[calendarData.ID];
                const eventRecord = calendarEventsCache?.events.get(eventData?.ID || 'undefined');

                if (eventRecord?.eventReadResult && eventData && onEventRead) {
                    onEventRead(calendarData.ID, eventData.ID, {
                        calendarViewEvent,
                        eventReadResult: eventRecord.eventReadResult,
                    });
                }

                if (!calendarEventsCache || !eventRecord || eventRecord.eventReadResult || seen.has(eventRecord)) {
                    return acc;
                }

                // To ignore recurring events
                seen.add(eventRecord);

                if (!getEventStoreRecordHasEventData(eventRecord)) {
                    eventRecord.eventReadResult = { error: new Error('Unknown process') };
                    return acc;
                }

                const getPromise = (initRetry?: InitRetry) =>
                    setEventRecordPromise({
                        eventRecord,
                        getCalendarEventRaw,
                        calendarsEventsCacheRef,
                        calendarEventsCache,
                        api: apiWithAbort,
                        getOpenedMailEvents,
                        forceDecryption,
                        initRetry,
                    }).then((eventReadResult) => {
                        if (eventReadResult && onEventRead) {
                            const { eventData } = eventRecord;
                            onEventRead(eventData.CalendarID, eventData.ID, { calendarViewEvent, eventReadResult });
                        }
                        return eventReadResult;
                    });

                if (!eventRecord.eventReadRetry) {
                    eventRecord.eventReadRetry = () =>
                        getPromise().then((result) => {
                            rerender();
                            return result;
                        });
                }

                if (!eventRecord.eventPromise) {
                    acc.push(getPromise(initRetry));
                }

                return acc;
            },
            []
        );

        if (calendarEventPromises.length === 0) {
            return setLoading(false);
        }

        setLoading(true);
        const done = () => {
            if (isMounted()) {
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
    }, [calendarEvents]);

    return loading;
};

export default useCalendarsEventsReader;

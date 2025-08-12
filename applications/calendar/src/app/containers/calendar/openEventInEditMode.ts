import type { SetStateAction } from 'react';

import { getOccurrences } from '@proton/shared/lib/calendar/recurrence/recurring';
import { getRecurrenceId } from '@proton/shared/lib/calendar/veventHelper';
import { fromUTCDateToLocalFakeUTCDate } from '@proton/shared/lib/date/timezone';
import type { Api } from '@proton/shared/lib/interfaces';
import type { CalendarEvent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { TYPE } from '../../components/calendar/interactions/constants';
import { generateEventUniqueId } from '../../helpers/event';
import type { OpenedMailEvent } from '../../hooks/useGetOpenedMailEvents';
import getSingleEditRecurringData from './event/getSingleEditRecurringData';
import parseMainEventData from './event/parseMainEventData';
import type { CalendarEventsCache, DecryptedEventTupleResult } from './eventStore/interface';
import { getEventAndUpsert } from './eventStore/useCalendarsEventsReader';
import getAllEventsByUID from './getAllEventsByUID';
import type {
    CalendarViewEvent,
    CalendarViewEventData,
    CalendarViewEventTemporaryEvent,
    EventTargetAction,
    InteractiveState,
} from './interface';

export const getTargetEventFromEvent = async ({
    calendarID,
    eventID,
    calendarEventsCache,
    api,
    getOpenedMailEvents,
    getEventDecrypted,
    targetCalendar,
    tzid,
}: {
    calendarID: string;
    eventID: string;
    calendarEventsCache: CalendarEventsCache;
    api: Api;
    getOpenedMailEvents?: () => OpenedMailEvent[];
    getEventDecrypted: (event: CalendarEvent) => Promise<DecryptedEventTupleResult>;
    targetCalendar: VisualCalendar;
    tzid: string;
}) => {
    const event = await getEventAndUpsert({
        calendarID,
        eventID,
        calendarEventsCache,
        api,
        getOpenedMailEvents,
    });

    const cachedRecord = calendarEventsCache.events.get(eventID);

    if (!cachedRecord) {
        throw new Error('Event not found in cache after upserting');
    }

    const { utcStart, utcEnd, eventData, isAllDay, isAllPartDay, eventReadResult, eventComponent } = cachedRecord;

    const data: CalendarViewEventData = {
        eventData,
        eventReadResult: eventReadResult || {
            result: await getEventDecrypted(event),
        },
        calendarData: targetCalendar,
    };

    if (eventComponent.rrule) {
        const occurrences = getOccurrences({ component: eventComponent, maxCount: 2 });
        if (occurrences.length > 0) {
            const [firstOccurrence] = occurrences;
            data.eventRecurrence = {
                occurrenceNumber: firstOccurrence.occurrenceNumber,
                localStart: firstOccurrence.localStart,
                localEnd: firstOccurrence.localEnd,
                isSingleOccurrence: occurrences.length === 1,
            };
        }
    } else if (getRecurrenceId(eventComponent)) {
        try {
            const uid = eventComponent.uid?.value;
            if (uid) {
                const eventsByUID = await getAllEventsByUID(api, calendarID, uid);
                const parentEvent = eventsByUID.find((event) => {
                    const parsedEvent = parseMainEventData(event);
                    return parsedEvent?.rrule && !getRecurrenceId(parsedEvent);
                });

                if (parentEvent) {
                    const parsedParentEvent = parseMainEventData(parentEvent);
                    if (parsedParentEvent) {
                        const recurrenceData = getSingleEditRecurringData(parsedParentEvent, eventComponent);
                        data.eventRecurrence = recurrenceData;
                    }
                }
            }
        } catch (error) {
            console.error('Could not find parent event for recurrence-id', error);
        }
    }

    const eventUniqueId = generateEventUniqueId(calendarID, eventID);
    const targetEvent: CalendarViewEvent = {
        uniqueId: eventUniqueId,
        isAllDay: isAllDay || isAllPartDay,
        isAllPartDay,
        start: fromUTCDateToLocalFakeUTCDate(utcStart, isAllDay, tzid),
        end: fromUTCDateToLocalFakeUTCDate(utcEnd, isAllDay, tzid),
        data,
    };

    return { targetEvent };
};

export const openEventInEditMode = async (
    eventId: string,
    calendarID: string,
    dependencies: {
        cachedCalendars: {
            [key: string]: CalendarEventsCache | undefined;
        };
        calendars: VisualCalendar[];
        api: Api;
        getOpenedMailEvents: () => OpenedMailEvent[];
        getEventDecrypted: (event: CalendarEvent) => Promise<DecryptedEventTupleResult>;
        handleEditEvent: (temporaryEvent: CalendarViewEventTemporaryEvent, isDuplicating?: boolean) => void;
        setEventTargetAction: (value: SetStateAction<EventTargetAction | undefined>) => void;
        setInteractiveData: (value: SetStateAction<InteractiveState | undefined>) => void;
        getEditedTemporaryEvent: (
            isDuplication?: boolean,
            targetEventOverride?: CalendarViewEvent
        ) => CalendarViewEventTemporaryEvent | null;
        tzid: string;
    }
) => {
    const {
        cachedCalendars,
        calendars,
        api,
        getOpenedMailEvents,
        getEventDecrypted,
        handleEditEvent,
        setInteractiveData,
        getEditedTemporaryEvent,
        tzid,
    } = dependencies;
    const calendarEventsCache = cachedCalendars[calendarID];
    const targetCalendar = calendars.find(({ ID }) => ID === calendarID);

    if (!calendarEventsCache || !targetCalendar) {
        return;
    }

    const { targetEvent } = await getTargetEventFromEvent({
        calendarID,
        eventID: eventId,
        calendarEventsCache,
        api,
        getOpenedMailEvents,
        getEventDecrypted,
        targetCalendar,
        tzid,
    });

    const temporaryEvent = getEditedTemporaryEvent(false, targetEvent) as CalendarViewEventTemporaryEvent;

    setInteractiveData({
        targetEventData: {
            uniqueId: targetEvent.uniqueId,
            type: TYPE.TIMEGRID,
        },
        temporaryEvent,
    });

    handleEditEvent(temporaryEvent, false);
};

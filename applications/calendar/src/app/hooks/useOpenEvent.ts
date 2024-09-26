import { useCallback } from 'react';

import { getUnixTime } from 'date-fns';

import { useGetCalendars } from '@proton/calendar/calendars/hooks';
import { useApi } from '@proton/components';
import { CacheType } from '@proton/redux-utilities';
import { getEvent, updateMember } from '@proton/shared/lib/api/calendars';
import { MAXIMUM_DATE, MINIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import getRecurrenceIdValueFromTimestamp from '@proton/shared/lib/calendar/recurrence/getRecurrenceIdValueFromTimestamp';
import { getOccurrences } from '@proton/shared/lib/calendar/recurrence/recurring';
import { getIsPropertyAllDay, getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { getRecurrenceIdDate } from '@proton/shared/lib/calendar/veventHelper';
import { addMilliseconds, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import type { Address } from '@proton/shared/lib/interfaces';
import type { CalendarEvent, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import parseMainEventData from '../containers/calendar/event/parseMainEventData';
import getAllEventsByUID from '../containers/calendar/getAllEventsByUID';

interface HandlerProps {
    calendars: VisualCalendar[];
    addresses: Address[];
    calendarID: string | null;
    eventID: string | null;
    recurrenceId: string | null;
    onGoToEvent: (eventData: CalendarEvent, eventComponent: VcalVeventComponent) => void;
    onGoToOccurrence: (
        eventData: CalendarEvent,
        eventComponent: VcalVeventComponent,
        occurrence: { localStart: Date; occurrenceNumber: number }
    ) => void;
    onEventNotFoundError: () => void;
    onOtherError?: () => void;
}

export const useOpenEvent = () => {
    const api = useApi();
    const getCalendars = useGetCalendars();

    return useCallback(
        async ({
            calendars,
            addresses,
            calendarID,
            eventID,
            recurrenceId,
            onGoToEvent,
            onGoToOccurrence,
            onEventNotFoundError,
            onOtherError,
        }: HandlerProps) => {
            if (!calendarID || !eventID) {
                return onEventNotFoundError();
            }
            const calendar = calendars.find(({ ID }) => ID === calendarID);
            if (!calendar) {
                return onEventNotFoundError();
            }
            if (!calendar.Display) {
                const [{ ID: memberID }] = getMemberAndAddress(addresses, calendar.Members);
                await api({
                    ...updateMember(calendarID, memberID, { Display: 1 }),
                    silence: true,
                }).catch(() => {});
                await getCalendars({ cache: CacheType.None });
            }
            try {
                const result = await api<{ Event: CalendarEvent }>({
                    ...getEvent(calendarID, eventID),
                    silence: true,
                });
                const parsedEvent = parseMainEventData(result.Event);

                if (!parsedEvent) {
                    throw new Error('Missing parsed event');
                }

                if (!parsedEvent.rrule) {
                    return onGoToEvent(result.Event, parsedEvent);
                }

                if (!recurrenceId) {
                    const occurrences = getOccurrences({ component: parsedEvent, maxCount: 1 });
                    if (!occurrences.length) {
                        return onEventNotFoundError();
                    }
                    const [firstOccurrence] = occurrences;
                    return onGoToOccurrence(result.Event, parsedEvent, firstOccurrence);
                }

                const parsedRecurrenceID = parseInt(recurrenceId || '', 10);

                if (
                    !Number.isInteger(parsedRecurrenceID) ||
                    parsedRecurrenceID < getUnixTime(MINIMUM_DATE) ||
                    parsedRecurrenceID > getUnixTime(MAXIMUM_DATE)
                ) {
                    return onEventNotFoundError();
                }

                const eventsByUID = await getAllEventsByUID(api, calendarID, parsedEvent.uid.value);

                const { dtstart } = parsedEvent;
                const localRecurrenceID = toUTCDate(
                    getRecurrenceIdValueFromTimestamp(
                        parsedRecurrenceID,
                        getIsPropertyAllDay(dtstart),
                        getPropertyTzid(dtstart) || 'UTC'
                    ).value
                );

                const isTargetOccurrenceEdited = eventsByUID.some((recurrence) => {
                    const parsedEvent = parseMainEventData(recurrence);
                    if (!parsedEvent) {
                        return false;
                    }
                    const recurrenceID = getRecurrenceIdDate(parsedEvent);
                    if (!recurrenceID) {
                        return false;
                    }
                    // Here a date-time comparison could be used instead, but since the recurrence id parameter can be easily tweaked to change
                    // e.g. the seconds and since a recurring granularity less than daily is not allowed, just compare the day
                    return isSameDay(localRecurrenceID, recurrenceID);
                });

                const maxStart = addMilliseconds(localRecurrenceID, 1);
                const untilTargetOccurrences = getOccurrences({
                    component: parsedEvent,
                    maxCount: 10000000,
                    maxStart,
                });
                if (!untilTargetOccurrences.length || isTargetOccurrenceEdited) {
                    // Target occurrence could not be found, fall back to the first generated occurrence
                    const initialOccurrences = getOccurrences({ component: parsedEvent, maxCount: 1 });
                    if (!initialOccurrences.length) {
                        return onEventNotFoundError();
                    }
                    const [firstOccurrence] = initialOccurrences;
                    return onGoToOccurrence(result.Event, parsedEvent, firstOccurrence);
                }
                const [firstOccurrence] = untilTargetOccurrences;
                const targetOccurrence = untilTargetOccurrences[untilTargetOccurrences.length - 1];
                // Target recurrence could not be expanded to
                if (!isSameDay(localRecurrenceID, targetOccurrence.localStart)) {
                    return onGoToOccurrence(result.Event, parsedEvent, firstOccurrence);
                }
                return onGoToOccurrence(result.Event, parsedEvent, targetOccurrence);
            } catch (e: any) {
                if (e.status >= 400 && e.status <= 499) {
                    return onEventNotFoundError();
                }
                return onOtherError?.();
            }
        },
        [api, getCalendars]
    );
};

import { useCallback } from 'react';

import { getUnixTime } from 'date-fns';

import { useApi, useCache } from '@proton/components';
import { getEvent, updateMember } from '@proton/shared/lib/api/calendars';
import { MAXIMUM_DATE, MINIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import { getMemberAndAddress } from '@proton/shared/lib/calendar/members';
import getRecurrenceIdValueFromTimestamp from '@proton/shared/lib/calendar/recurrence/getRecurrenceIdValueFromTimestamp';
import { getOccurrences } from '@proton/shared/lib/calendar/recurrence/recurring';
import { getIsPropertyAllDay, getPropertyTzid, getRecurrenceIdDate } from '@proton/shared/lib/calendar/vcalHelper';
import { addMilliseconds, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { Address } from '@proton/shared/lib/interfaces';
import { CalendarEventWithMetadata, VcalVeventComponent, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { CalendarsModel } from '@proton/shared/lib/models';
import { loadModels } from '@proton/shared/lib/models/helper';

import parseMainEventData from '../containers/calendar/event/parseMainEventData';
import getAllEventsByUID from '../containers/calendar/getAllEventsByUID';

interface HandlerProps {
    calendars: VisualCalendar[];
    addresses: Address[];
    calendarID: string | null;
    eventID: string | null;
    recurrenceId: string | null;
    onGoToEvent: (eventData: CalendarEventWithMetadata, eventComponent: VcalVeventComponent) => void;
    onGoToOccurrence: (
        eventData: CalendarEventWithMetadata,
        eventComponent: VcalVeventComponent,
        occurrence: { localStart: Date; occurrenceNumber: number }
    ) => void;
    onLinkError: () => void;
    onOtherError?: () => void;
}

export const useOpenEvent = () => {
    const api = useApi();
    const cache = useCache();

    return useCallback(
        async ({
            calendars,
            addresses,
            calendarID,
            eventID,
            recurrenceId,
            onGoToEvent,
            onGoToOccurrence,
            onLinkError,
            onOtherError,
        }: HandlerProps) => {
            if (!calendarID || !eventID) {
                return onLinkError();
            }
            const calendar = calendars.find(({ ID }) => ID === calendarID);
            if (!calendar) {
                return onLinkError();
            }
            if (!calendar.Display) {
                const [{ ID: memberID }] = getMemberAndAddress(addresses, calendar.Members);
                await api({
                    ...updateMember(calendarID, memberID, { Display: 1 }),
                    silence: true,
                }).catch(() => {});
                await loadModels([CalendarsModel], { api, cache, useCache: false });
            }
            try {
                const result = await api<{ Event: CalendarEventWithMetadata }>({
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
                        return onLinkError();
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
                    return onLinkError();
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
                        return onLinkError();
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
                    return onLinkError();
                }
                return onOtherError?.();
            }
        },
        [api, cache]
    );
};

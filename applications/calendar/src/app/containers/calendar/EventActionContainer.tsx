import { MutableRefObject, useEffect } from 'react';
import { LoaderPage, useNotifications, useApi, useCache } from '@proton/components';
import { useHistory } from 'react-router-dom';
import { c } from 'ttag';
import { getUnixTime } from 'date-fns';
import { Calendar, CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { updateCalendar, getEvent } from '@proton/shared/lib/api/calendars';
import { getDateOrDateTimeProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { loadModels } from '@proton/shared/lib/models/helper';
import { CalendarsModel } from '@proton/shared/lib/models';
import { MAXIMUM_DATE, MINIMUM_DATE } from '@proton/shared/lib/calendar/constants';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { addMilliseconds, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { getOccurrences } from '@proton/shared/lib/calendar/recurring';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { getIsPropertyAllDay, getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import parseMainEventData from './event/parseMainEventData';
import { getRecurrenceIdDate, getRecurrenceIdValueFromTimestamp } from './event/getEventHelper';
import { EventTargetAction } from './interface';
import { getCalendarEventStoreRecord } from './eventStore/cache/upsertCalendarEventStoreRecord';
import getAllEventsByUID from './getAllEventsByUID';

interface Props {
    calendars: Calendar[];
    tzid: string;
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>;
}
const EventActionContainer = ({ tzid, calendars, eventTargetActionRef }: Props) => {
    const { createNotification } = useNotifications();
    const history = useHistory();
    const api = useApi();
    const cache = useCache();

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('Action');

            if (action === 'VIEW') {
                const handleLinkError = () => {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Invalid link to the event`,
                    });
                    history.replace('/');
                };

                const handleOtherError = () => {
                    history.replace('/');
                };

                const handleGotoRange = async (date: Date) => {
                    history.replace(
                        `/week/${[date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].join('/')}`
                    );
                };

                const handleGotoOccurrence = (
                    eventData: CalendarEvent,
                    eventComponent: VcalVeventComponent,
                    occurrence: { localStart: Date; occurrenceNumber: number }
                ) => {
                    const { isAllDay, isAllPartDay } = getCalendarEventStoreRecord(eventComponent, eventData);

                    const withOccurrenceDtstart = getDateOrDateTimeProperty(
                        eventComponent.dtstart,
                        occurrence.localStart
                    );
                    const utcDate = propertyToUTCDate(withOccurrenceDtstart);
                    const startInTzid = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid));
                    eventTargetActionRef.current = {
                        id: `${eventData.ID}-${occurrence.occurrenceNumber}`,
                        isAllDay,
                        isAllPartDay,
                        startInTzid,
                    };
                    return handleGotoRange(startInTzid);
                };

                const handleGotoEvent = (eventData: CalendarEvent, eventComponent: VcalVeventComponent) => {
                    const { isAllDay, isAllPartDay } = getCalendarEventStoreRecord(eventComponent, eventData);

                    const utcDate = propertyToUTCDate(eventComponent.dtstart);
                    const startInTzid = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid));
                    eventTargetActionRef.current = {
                        id: eventData.ID,
                        isAllDay,
                        isAllPartDay,
                        startInTzid,
                    };
                    return handleGotoRange(startInTzid);
                };

                const calendarID = params.get('CalendarID');
                const eventID = params.get('EventID');
                const recurrenceId = params.get('RecurrenceID');

                if (!calendarID || !eventID) {
                    return handleLinkError();
                }
                const calendar = calendars.find(({ ID }) => ID === calendarID);
                if (!calendar) {
                    return handleLinkError();
                }
                if (!calendar.Display) {
                    await api({
                        ...updateCalendar(calendarID, { Display: 1 }),
                        silence: true,
                    }).catch(() => {});
                    await loadModels([CalendarsModel], { api, cache, useCache: false });
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
                        return handleGotoEvent(result.Event, parsedEvent);
                    }

                    if (!recurrenceId) {
                        const occurrences = getOccurrences({ component: parsedEvent, maxCount: 1 });
                        if (!occurrences.length) {
                            return handleLinkError();
                        }
                        const [firstOccurrence] = occurrences;
                        return handleGotoOccurrence(result.Event, parsedEvent, firstOccurrence);
                    }

                    const parsedRecurrenceID = parseInt(recurrenceId || '', 10);

                    if (
                        !Number.isInteger(parsedRecurrenceID) ||
                        parsedRecurrenceID < getUnixTime(MINIMUM_DATE) ||
                        parsedRecurrenceID > getUnixTime(MAXIMUM_DATE)
                    ) {
                        return handleLinkError();
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
                            return handleLinkError();
                        }
                        const [firstOccurrence] = initialOccurrences;
                        return handleGotoOccurrence(result.Event, parsedEvent, firstOccurrence);
                    }
                    const [firstOccurrence] = untilTargetOccurrences;
                    const targetOccurrence = untilTargetOccurrences[untilTargetOccurrences.length - 1];
                    // Target recurrence could not be expanded to
                    if (!isSameDay(localRecurrenceID, targetOccurrence.localStart)) {
                        return handleGotoOccurrence(result.Event, parsedEvent, firstOccurrence);
                    }
                    return handleGotoOccurrence(result.Event, parsedEvent, targetOccurrence);
                } catch (e) {
                    if (e.status >= 400 && e.status <= 499) {
                        return handleLinkError();
                    }
                    return handleOtherError();
                }
            }

            history.replace('/');
        };

        run();
    }, []);

    return <LoaderPage />;
};

export default EventActionContainer;

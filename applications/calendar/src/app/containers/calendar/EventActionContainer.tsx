import React, { MutableRefObject, useEffect } from 'react';
import { LoaderPage, useNotifications, useApi, useCache } from 'react-components';
import { c } from 'ttag';
import * as H from 'history';
import { getUnixTime } from 'date-fns';
import { Calendar, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { updateCalendar, getEvent } from 'proton-shared/lib/api/calendars';
import { getDateOrDateTimeProperty, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { loadModels } from 'proton-shared/lib/models/helper';
import { CalendarsModel } from 'proton-shared/lib/models';
import { MAXIMUM_DATE, MINIMUM_DATE } from 'proton-shared/lib/calendar/constants';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from 'proton-shared/lib/date/timezone';
import { addMilliseconds, isSameDay } from 'proton-shared/lib/date-fns-utc';
import { getOccurrences } from 'proton-shared/lib/calendar/recurring';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getIsPropertyAllDay, getPropertyTzid } from 'proton-shared/lib/calendar/vcalHelper';
import parseMainEventData from './event/parseMainEventData';
import { getRecurrenceIdValueFromTimestamp } from './event/getEventHelper';
import { EventTargetAction } from './interface';
import { getCalendarEventStoreRecord } from './eventStore/cache/upsertCalendarEventStoreRecord';

interface Props {
    history: H.History;
    calendars: Calendar[];
    tzid: string;
    eventTargetActionRef: MutableRefObject<EventTargetAction | undefined>;
}
const EventActionContainer = ({ tzid, history, calendars, eventTargetActionRef }: Props) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const cache = useCache();

    useEffect(() => {
        const run = async () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');

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
                        `/calendar/week/${[date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()].join('/')}`
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

                    const { dtstart } = parsedEvent;
                    const localRecurrenceID = toUTCDate(
                        getRecurrenceIdValueFromTimestamp(
                            parsedRecurrenceID,
                            getIsPropertyAllDay(dtstart),
                            getPropertyTzid(dtstart) || 'UTC'
                        ).value
                    );

                    const maxStart = addMilliseconds(localRecurrenceID, 1);
                    const occurrences = getOccurrences({ component: parsedEvent, maxCount: 10000000, maxStart });
                    if (!occurrences.length) {
                        return handleLinkError();
                    }
                    const [firstOccurrence] = occurrences;
                    const targetOccurrence = occurrences[occurrences.length - 1];
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

    return <LoaderPage text={c('Info').t`Loading ProtonCalendar`} />;
};

export default EventActionContainer;

import { fromUnixTime } from 'date-fns';
import { CalendarEventWithoutBlob } from 'proton-shared/lib/interfaces/calendar';
import { VcalRrulePropertyValue, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getDateProperty, getDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { convertUTCDateTimeToZone, fromUTCDate } from 'proton-shared/lib/date/timezone';
import { fromRruleString } from 'proton-shared/lib/calendar/vcal';
import { toExdate } from '../../recurrence/helper';

const getComponentFromCalendarEventWithoutBlob = (eventData: CalendarEventWithoutBlob): VcalVeventComponent => {
    const { FullDay, StartTime, StartTimezone, EndTime, EndTimezone, RRule, RecurrenceID, Exdates } = eventData;
    const isAllDay = FullDay === 1;

    const utcTimestampToTimezone = (unixTime: number, timezone: string) => {
        return convertUTCDateTimeToZone(fromUTCDate(fromUnixTime(unixTime)), timezone);
    };

    const getDtstampComponent = () => {
        return {
            dtstamp: { value: { ...fromUTCDate(new Date()), isUTC: true } },
        };
    };

    const getTimeComponents = () => {
        if (isAllDay) {
            const utcStartDate = fromUnixTime(StartTime);
            const utcEndDate = fromUnixTime(EndTime);
            return {
                dtstart: getDateProperty(fromUTCDate(utcStartDate)),
                dtend: getDateProperty(fromUTCDate(utcEndDate)),
            };
        }
        const localStartDateTime = utcTimestampToTimezone(StartTime, StartTimezone);
        const localEndDateTime = utcTimestampToTimezone(EndTime, EndTimezone);
        return {
            dtstart: getDateTimeProperty(localStartDateTime, StartTimezone),
            dtend: getDateTimeProperty(localEndDateTime, EndTimezone),
        };
    };

    const getRruleComponent = (Rrule?: string) => {
        if (!Rrule) {
            return {};
        }
        const rruleValue: VcalRrulePropertyValue = fromRruleString(Rrule);
        if (!rruleValue) {
            return {};
        }
        return { rrule: { value: rruleValue } };
    };

    const getRecurrenceIdComponent = (recurrenceId?: number) => {
        if (!recurrenceId) {
            return {};
        }
        const localStartDateTime = utcTimestampToTimezone(recurrenceId, StartTimezone);
        return {
            'recurrence-id': toExdate(localStartDateTime, isAllDay, StartTimezone),
        };
    };

    const getRecurrenceExdate = (exdates: number[]) => {
        if (!Array.isArray(exdates) || exdates.length === 0) {
            return;
        }
        return {
            exdate: exdates.map((exdate) => {
                return toExdate(utcTimestampToTimezone(exdate, StartTimezone), isAllDay, StartTimezone);
            }),
        };
    };

    return {
        component: 'vevent',
        uid: {
            value: eventData.UID,
        },
        ...getDtstampComponent(),
        ...getTimeComponents(),
        ...getRruleComponent(RRule),
        ...getRecurrenceIdComponent(RecurrenceID),
        ...getRecurrenceExdate(Exdates),
    };
};

export default getComponentFromCalendarEventWithoutBlob;

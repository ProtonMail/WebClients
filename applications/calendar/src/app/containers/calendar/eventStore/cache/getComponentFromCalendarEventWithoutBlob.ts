import { fromUnixTime } from 'date-fns';

import { toExdate } from '@proton/shared/lib/calendar/exdate';
import getRecurrenceIdValueFromTimestamp from '@proton/shared/lib/calendar/recurrence/getRecurrenceIdValueFromTimestamp';
import { fromRruleString } from '@proton/shared/lib/calendar/vcal';
import { getDateProperty, getDateTimeProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { SECOND } from '@proton/shared/lib/constants';
import { convertTimestampToTimezone, fromUTCDate } from '@proton/shared/lib/date/timezone';
import { Nullable } from '@proton/shared/lib/interfaces';
import { CalendarEventWithoutBlob } from '@proton/shared/lib/interfaces/calendar';
import { VcalRrulePropertyValue } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { MetadataVcalVeventComponent } from '../interface';

const getComponentFromCalendarEventWithoutBlob = (eventData: CalendarEventWithoutBlob): MetadataVcalVeventComponent => {
    const { FullDay, StartTime, StartTimezone, EndTime, EndTimezone, RRule, RecurrenceID, Exdates } = eventData;
    const isAllDay = FullDay === 1;

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
        const localStartDateTime = convertTimestampToTimezone(StartTime * SECOND, StartTimezone);
        const localEndDateTime = convertTimestampToTimezone(EndTime * SECOND, EndTimezone);
        return {
            dtstart: getDateTimeProperty(localStartDateTime, StartTimezone),
            dtend: getDateTimeProperty(localEndDateTime, EndTimezone),
        };
    };

    const getRruleComponent = (Rrule: Nullable<string>) => {
        if (!Rrule) {
            return {};
        }
        const rruleValue: VcalRrulePropertyValue | undefined = fromRruleString(Rrule);
        if (!rruleValue) {
            return {};
        }
        return { rrule: { value: rruleValue } };
    };

    const getRecurrenceIdComponent = (recurrenceId: Nullable<number>) => {
        if (!recurrenceId) {
            return {};
        }
        return {
            'recurrence-id': getRecurrenceIdValueFromTimestamp(recurrenceId, isAllDay, StartTimezone),
        };
    };

    const getRecurrenceExdate = (exdates: number[]) => {
        if (!Array.isArray(exdates) || exdates.length === 0) {
            return;
        }
        return {
            exdate: exdates.map((exdate) => {
                return toExdate(convertTimestampToTimezone(exdate * SECOND, StartTimezone), isAllDay, StartTimezone);
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

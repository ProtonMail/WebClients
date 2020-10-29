import { addDays } from '../date-fns-utc';
import { convertUTCDateTimeToZone, convertZonedDateTimeToUTC, fromUTCDate, toUTCDate } from '../date/timezone';
import { buildMailTo, getEmailTo } from '../helpers/email';
import { mod } from '../helpers/math';
import { DateTime } from '../interfaces/calendar/Date';
import {
    VcalAttendeeProperty,
    VcalDateOrDateTimeProperty,
    VcalDateOrDateTimeValue,
    VcalDateProperty,
    VcalDateTimeProperty,
    VcalDays,
    VcalDaysKeys,
    VcalOrganizerProperty,
    VcalVeventComponent,
} from '../interfaces/calendar/VcalModel';
import { getIsPropertyAllDay, getPropertyTzid } from './vcalHelper';

export const dateToProperty = ({
    year = 1,
    month = 1,
    day = 1,
}: {
    year: number;
    month: number;
    day: number;
}): VcalDateProperty => {
    return {
        value: { year, month, day },
        parameters: { type: 'date' },
    };
};

export const dateTimeToProperty = (
    { year = 1, month = 1, day = 1, hours = 0, minutes = 0, seconds = 0 }: DateTime,
    isUTC = false,
    tzid?: string
): VcalDateTimeProperty => {
    const value = { year, month, day, hours, minutes, seconds, isUTC };
    if (!tzid || isUTC) {
        return {
            value,
        };
    }
    return {
        value,
        parameters: {
            tzid,
        },
    };
};

export const getDateProperty = ({ year, month, day }: { year: number; month: number; day: number }) => {
    return dateToProperty({ year, month, day });
};

export const getDateTimeProperty = (zonelessTime: DateTime, tzid = '') => {
    const isUTC = (tzid || '').toLowerCase().includes('utc');
    return dateTimeToProperty(zonelessTime, isUTC, isUTC ? undefined : tzid);
};

export const getDateOrDateTimeProperty = (property: VcalDateOrDateTimeProperty, start: Date) => {
    if (getIsPropertyAllDay(property)) {
        return getDateProperty(fromUTCDate(start));
    }
    return getDateTimeProperty(fromUTCDate(start), getPropertyTzid(property));
};

export const propertyToUTCDate = (property: VcalDateOrDateTimeProperty) => {
    if (getIsPropertyAllDay(property) || property.value.isUTC || !property.parameters?.tzid) {
        return toUTCDate(property.value);
    }
    // For dates with a timezone, convert the relative date time to UTC time
    return toUTCDate(convertZonedDateTimeToUTC(property.value, property.parameters.tzid));
};

interface GetDtendPropertyArgs {
    dtstart: VcalDateOrDateTimeProperty;
    dtend?: VcalDateOrDateTimeProperty;
}
export const getDtendProperty = ({ dtstart, dtend }: GetDtendPropertyArgs) => {
    if (dtend) {
        return dtend;
    }
    if (getIsPropertyAllDay(dtstart)) {
        const utcEnd = addDays(toUTCDate(dtstart.value), 1);
        return getDateProperty(fromUTCDate(utcEnd));
    }
    return getDateTimeProperty(dtstart.value, getPropertyTzid(dtstart));
};

export const dayToNumericDay = (day: VcalDaysKeys): VcalDays | undefined => {
    return VcalDays[day];
};

export const numericDayToDay = (number: VcalDays): VcalDaysKeys => {
    if (number in VcalDays) {
        return VcalDays[number] as VcalDaysKeys;
    }
    return VcalDays[mod(number, 7)] as VcalDaysKeys;
};

export const getDateTimePropertyInDifferentTimezone = (
    property: VcalDateOrDateTimeProperty,
    tzid: string,
    isAllDay?: boolean
) => {
    if (isAllDay === true || getIsPropertyAllDay(property)) {
        return getDateProperty(property.value);
    }
    const utcDate = propertyToUTCDate(property);
    const zonedDate = convertUTCDateTimeToZone(fromUTCDate(utcDate), tzid);
    return getDateTimeProperty(zonedDate, tzid);
};

export interface UntilDateArgument {
    year: number;
    month: number;
    day: number;
}
export const getUntilProperty = (
    untilDateTime: UntilDateArgument,
    isAllDay: boolean,
    tzid = 'UTC'
): VcalDateOrDateTimeValue => {
    // According to the RFC, we should use UTC dates if and only if the event is not all-day.
    if (isAllDay) {
        // we should use a floating date in this case
        return {
            year: untilDateTime.year,
            month: untilDateTime.month,
            day: untilDateTime.day,
        };
    }
    // Pick end of day in the event start date timezone
    const zonedEndOfDay = { ...untilDateTime, hours: 23, minutes: 59, seconds: 59 };
    const utcEndOfDay = convertZonedDateTimeToUTC(zonedEndOfDay, tzid);
    return { ...utcEndOfDay, isUTC: true };
};

export const extractEmailAddress = ({ value, parameters }: VcalAttendeeProperty | VcalOrganizerProperty) => {
    const email = value || parameters?.cn;
    return email && getEmailTo(email);
};

export const buildVcalOrganizer = (email: string, cn?: string) => {
    return {
        value: buildMailTo(email),
        parameters: {
            cn: cn || email,
        },
    };
};

export const buildVcalAttendee = (email: string) => {
    return {
        value: buildMailTo(email),
        parameters: {
            cn: email,
        },
    };
};

export const getHasModifiedDateTimes = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    const { dtstart: newDtstart } = newVevent;
    const { dtstart: oldDtstart } = oldVevent;
    const isStartPreserved = +propertyToUTCDate(newDtstart) === +propertyToUTCDate(oldDtstart);
    const isEndPreserved =
        +propertyToUTCDate(getDtendProperty(newVevent)) === +propertyToUTCDate(getDtendProperty(oldVevent));
    return !isStartPreserved || !isEndPreserved;
};

const getIsEquivalentAttendee = (newAttendee: VcalAttendeeProperty, oldAttendee: VcalAttendeeProperty) => {
    if (newAttendee.value !== oldAttendee.value) {
        return false;
    }
    if (newAttendee.parameters?.partstat !== oldAttendee.parameters?.partstat) {
        return false;
    }
    if (newAttendee.parameters?.role !== oldAttendee.parameters?.role) {
        return false;
    }
    return true;
};

export const getHasModifiedAttendees = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    const { attendee: newAttendees } = newVevent;
    const { attendee: oldAttendees } = oldVevent;
    if (!newAttendees) {
        return !!oldAttendees;
    }
    if (!oldAttendees || oldAttendees.length !== newAttendees.length) {
        return true;
    }
    const modifiedAttendees = [...oldAttendees];
    newAttendees.forEach((attendee) => {
        const index = modifiedAttendees.findIndex((oldAttendee) => getIsEquivalentAttendee(oldAttendee, attendee));
        if (index === -1) {
            return true;
        }
        modifiedAttendees.splice(index, 1);
    });
    return false;
};

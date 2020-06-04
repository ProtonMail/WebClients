import { convertZonedDateTimeToUTC, fromUTCDate, toUTCDate } from '../date/timezone';
import { DateTime } from '../interfaces/calendar/Date';
import {
    VcalDateOrDateTimeProperty,
    VcalDateProperty,
    VcalDateTimeProperty,
    VcalDaysKeys,
    VcalDays,
    VcalVeventComponent
} from '../interfaces/calendar/VcalModel';
import { mod } from '../helpers/math';
import { getIsIcalPropertyAllDay } from './vcalHelper';

export const dateToProperty = ({
    year = 1,
    month = 1,
    day = 1
}: {
    year: number;
    month: number;
    day: number;
}): VcalDateProperty => {
    return {
        value: { year, month, day },
        parameters: { type: 'date' }
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
            value
        };
    }
    return {
        value,
        parameters: {
            tzid
        }
    };
};

export const getDateProperty = ({ year, month, day }: { year: number; month: number; day: number }) => {
    return dateToProperty({ year, month, day });
};

export const getDateTimeProperty = (zonelessTime: DateTime, tzid = '') => {
    const isUTC = (tzid || '').toLowerCase().includes('utc');
    return dateTimeToProperty(zonelessTime, isUTC, isUTC ? undefined : tzid);
};

export const getPropertyTzid = (property: VcalDateOrDateTimeProperty) => {
    if (getIsIcalPropertyAllDay(property)) {
        return;
    }
    return property.value.isUTC ? 'UTC' : property.parameters?.tzid;
};

export const getDateOrDateTimeProperty = (property: VcalDateOrDateTimeProperty, start: Date) => {
    if (getIsIcalPropertyAllDay(property)) {
        return getDateProperty(fromUTCDate(start));
    }
    return getDateTimeProperty(fromUTCDate(start), getPropertyTzid(property));
};

export const isIcalAllDay = ({ dtstart, dtend }: VcalVeventComponent) => {
    return (dtstart && getIsIcalPropertyAllDay(dtstart)) || (dtend && getIsIcalPropertyAllDay(dtend));
};

export const propertyToUTCDate = (property: VcalDateOrDateTimeProperty) => {
    if (getIsIcalPropertyAllDay(property) || property.value.isUTC || !property.parameters?.tzid) {
        return toUTCDate(property.value);
    }
    // For dates with a timezone, convert the relative date time to UTC time
    return toUTCDate(convertZonedDateTimeToUTC(property.value, property.parameters.tzid));
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

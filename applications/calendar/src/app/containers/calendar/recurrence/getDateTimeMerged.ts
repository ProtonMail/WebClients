import { VcalDateOrDateTimeProperty } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import {
    getDateOrDateTimeProperty,
    getDateProperty,
    getDateTimeProperty,
} from '@proton/shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import { toUTCDate } from '@proton/shared/lib/date/timezone';

export const getStartDateTimeMerged = (
    newProperty: VcalDateOrDateTimeProperty,
    originalProperty: VcalDateOrDateTimeProperty
): VcalDateOrDateTimeProperty => {
    if (getIsPropertyAllDay(newProperty)) {
        return getDateProperty(originalProperty.value);
    }
    return getDateTimeProperty(
        {
            year: originalProperty.value.year,
            month: originalProperty.value.month,
            day: originalProperty.value.day,
            hours: newProperty.value.hours,
            minutes: newProperty.value.minutes,
            seconds: 0,
        },
        newProperty.parameters?.tzid || 'UTC'
    );
};

export const getEndDateTimeMerged = (
    newStartProperty: VcalDateOrDateTimeProperty,
    newEndProperty: VcalDateOrDateTimeProperty,
    originalStartProperty: VcalDateOrDateTimeProperty
): VcalDateOrDateTimeProperty => {
    const diff = +toUTCDate(newEndProperty.value) - +toUTCDate(newStartProperty.value);
    const newEnd = +toUTCDate(originalStartProperty.value) + diff;
    return getDateOrDateTimeProperty(newEndProperty, new Date(newEnd));
};

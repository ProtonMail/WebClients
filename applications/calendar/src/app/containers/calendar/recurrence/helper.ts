import {
    getDateProperty,
    getDateTimeProperty,
    getUntilProperty,
    propertyToUTCDate,
} from 'proton-shared/lib/calendar/vcalConverter';
import { getIsAllDay, getPropertyTzid } from 'proton-shared/lib/calendar/vcalHelper';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import {
    VcalDateOrDateTimeProperty,
    VcalDateProperty,
    VcalDateTimeProperty,
    VcalRruleProperty,
    VcalVeventComponent,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { DateTimeValue } from 'proton-shared/lib/interfaces/calendar';

export const toExdate = (dateObject: DateTimeValue, isAllDay: boolean, tzid = 'UTC'): VcalDateOrDateTimeProperty => {
    if (isAllDay) {
        return getDateProperty(dateObject) as VcalDateProperty;
    }
    return getDateTimeProperty(dateObject, tzid) as VcalDateTimeProperty;
};

export const getSafeRruleCount = (rrule: VcalRruleProperty, newCount: number) => {
    if (newCount < 1) {
        return;
    }

    return {
        ...rrule,
        value: {
            ...rrule.value,
            count: newCount,
        },
    };
};

export const getSafeRruleUntil = (rrule: VcalRruleProperty, component: VcalVeventComponent) => {
    const { dtstart } = component;

    if (!rrule.value.until) {
        throw new Error('Until required');
    }

    const originalUntilDateTime = toUTCDate(rrule.value.until);
    const newStartTime = propertyToUTCDate(dtstart);

    // If the event was moved after the until date, fixup the until
    if (newStartTime > originalUntilDateTime) {
        const until = getUntilProperty(dtstart.value, getIsAllDay(component), getPropertyTzid(dtstart));
        return {
            ...rrule,
            value: {
                ...rrule.value,
                until,
            },
        };
    }

    return rrule;
};

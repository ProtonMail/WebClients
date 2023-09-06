import { getUntilProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import {getIsAllDay} from '@proton/shared/lib/calendar/veventHelper';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { VcalRruleProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

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

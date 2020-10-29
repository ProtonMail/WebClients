import { VcalDateOrDateTimeProperty, VcalRruleProperty } from '../interfaces/calendar/VcalModel';
import { getIsPropertyAllDay, getPropertyTzid } from './vcalHelper';
import { getUntilProperty } from './vcalConverter';

export const withRruleUntil = (rrule: VcalRruleProperty, dtstart: VcalDateOrDateTimeProperty): VcalRruleProperty => {
    const until = rrule.value?.until;
    if (!until) {
        return rrule;
    }
    return {
        ...rrule,
        value: {
            ...rrule.value,
            until: getUntilProperty(until, getIsPropertyAllDay(dtstart), getPropertyTzid(dtstart)),
        },
    };
};

import { VcalDateOrDateTimeProperty, VcalRruleProperty } from '../../interfaces/calendar/VcalModel';
import { getUntilProperty } from '../vcalConverter';
import { getIsPropertyAllDay, getPropertyTzid } from '../vcalHelper';

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

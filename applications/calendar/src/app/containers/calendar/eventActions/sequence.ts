import { getDtendProperty, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

export const withIncreasedSequence = (event: VcalVeventComponent) => {
    const sequenceValue = event.sequence?.value;
    if (sequenceValue === undefined) {
        return { ...event, sequence: { value: 0 } };
    }
    return {
        ...event,
        sequence: { value: Math.max(0, sequenceValue) + 1 },
    };
};

export const withVeventSequence = (
    event: VcalVeventComponent,
    oldEvent: VcalVeventComponent,
    hasModifiedRrule?: boolean
) => {
    if (oldEvent.sequence?.value === undefined) {
        return { ...event, sequence: { value: 0 } };
    }
    const { dtstart, rrule } = event;
    const { dtstart: oldDtstart, rrule: oldRrule, sequence: oldSequence } = oldEvent;
    const { sequence: newSequence } = event;
    const [dtend, oldDtend] = [event, oldEvent].map(getDtendProperty);
    const [isAllDay, oldIsAllDay] = [dtstart, oldDtstart].map(getIsPropertyAllDay);
    const isAllDayPreserved = isAllDay === oldIsAllDay;
    const isStartPreserved = +propertyToUTCDate(dtstart) === +propertyToUTCDate(oldDtstart);
    const isEndPreserved = +propertyToUTCDate(dtend) === +propertyToUTCDate(oldDtend);
    const isRrulePreserved = hasModifiedRrule === undefined ? isDeepEqual(rrule, oldRrule) : !hasModifiedRrule;
    const oldSequenceValue = Math.max(0, oldSequence.value);
    if (isAllDayPreserved && isStartPreserved && isEndPreserved && isRrulePreserved) {
        return newSequence ? { ...event } : { ...event, sequence: { value: oldSequenceValue } };
    }
    return {
        ...event,
        sequence: { value: oldSequenceValue + 1 },
    };
};

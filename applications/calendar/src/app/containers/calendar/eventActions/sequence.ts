import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
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
    const { dtstart, dtend, rrule } = event;
    const { dtstart: oldDtstart, dtend: oldDtend, rrule: oldRrule, sequence: oldSequence } = oldEvent;
    const [isAllDay, oldIsAllDay] = [dtstart, oldDtstart].map(getIsPropertyAllDay);
    const isIsAllDayPreserved = isAllDay === oldIsAllDay;
    const isStartPreserved = +propertyToUTCDate(dtstart) === +propertyToUTCDate(oldDtstart);
    const isEndPreserved =
        (!dtend && !oldDtend) || (dtend && oldDtend && +propertyToUTCDate(dtend) === +propertyToUTCDate(oldDtend));
    const isRrulePreserved = hasModifiedRrule === undefined ? isDeepEqual(rrule, oldRrule) : !hasModifiedRrule;
    if (isIsAllDayPreserved && isStartPreserved && isEndPreserved && isRrulePreserved) {
        return event;
    }
    const oldSequenceValue = Math.max(0, oldSequence.value);
    return {
        ...event,
        sequence: { value: oldSequenceValue + 1 },
    };
};

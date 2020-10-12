import { getHasModifiedDateTimes } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

export const withIncreasedSequence = (vevent: VcalVeventComponent) => {
    const sequenceValue = vevent.sequence?.value;
    if (sequenceValue === undefined) {
        return { ...vevent, sequence: { value: 0 } };
    }
    return {
        ...vevent,
        sequence: { value: Math.max(0, sequenceValue) + 1 },
    };
};

export const withVeventSequence = (
    vevent: VcalVeventComponent,
    oldVevent: VcalVeventComponent,
    hasModifiedRrule?: boolean
) => {
    if (oldVevent.sequence?.value === undefined) {
        return { ...vevent, sequence: { value: 0 } };
    }
    const { dtstart, rrule } = vevent;
    const { dtstart: oldDtstart, rrule: oldRrule, sequence: oldSequence } = oldVevent;
    const { sequence: newSequence } = vevent;
    const [isAllDay, oldIsAllDay] = [dtstart, oldDtstart].map(getIsPropertyAllDay);
    const isAllDayPreserved = isAllDay === oldIsAllDay;
    const areDateTimesPreserved = !getHasModifiedDateTimes(vevent, oldVevent);
    const isRrulePreserved = hasModifiedRrule === undefined ? isDeepEqual(rrule, oldRrule) : !hasModifiedRrule;
    const oldSequenceValue = Math.max(0, oldSequence.value);
    if (isAllDayPreserved && areDateTimesPreserved && isRrulePreserved) {
        return newSequence ? { ...vevent } : { ...vevent, sequence: { value: oldSequenceValue } };
    }
    return {
        ...vevent,
        sequence: { value: oldSequenceValue + 1 },
    };
};

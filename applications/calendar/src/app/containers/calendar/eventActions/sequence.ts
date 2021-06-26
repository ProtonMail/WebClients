import { getIsRruleSubset } from '@proton/shared/lib/calendar/rruleSubset';
import { getHasModifiedDateTimes } from '@proton/shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { withUpdatedDtstamp } from './dtstamp';

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

export const withVeventSequence = (vevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    if (oldVevent.sequence?.value === undefined) {
        return { ...vevent, sequence: { value: 0 } };
    }
    const { dtstart } = vevent;
    const { dtstart: oldDtstart, sequence: oldSequence } = oldVevent;
    const { sequence: newSequence } = vevent;
    const [isAllDay, oldIsAllDay] = [dtstart, oldDtstart].map(getIsPropertyAllDay);
    const isAllDayPreserved = isAllDay === oldIsAllDay;
    const areDateTimesPreserved = !getHasModifiedDateTimes(vevent, oldVevent);
    const isRrulePreservedOrSubset =
        isAllDayPreserved && areDateTimesPreserved ? getIsRruleSubset(vevent, oldVevent) : false;
    const oldSequenceValue = Math.max(0, oldSequence.value);
    if (isAllDayPreserved && areDateTimesPreserved && isRrulePreservedOrSubset) {
        return newSequence ? { ...vevent } : { ...vevent, sequence: { value: oldSequenceValue } };
    }
    return {
        ...vevent,
        sequence: { value: oldSequenceValue + 1 },
    };
};

export const withUpdatedDtstampAndSequence = (newVevent: VcalVeventComponent, oldVevent: VcalVeventComponent) => {
    return withVeventSequence(withUpdatedDtstamp(newVevent, oldVevent), oldVevent);
};

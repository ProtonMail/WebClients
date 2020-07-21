import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsPropertyAllDay } from 'proton-shared/lib/calendar/vcalHelper';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { RECURRING_TYPES } from '../../../constants';
import { EventNewData, EventOldData } from '../../../interfaces/EventData';

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

const withVeventSequence = (event: VcalVeventComponent, oldEvent: VcalVeventComponent, hasModifiedRrule?: boolean) => {
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

export const getSaveSingleEventDataWithSequence = (newEditEventData: EventNewData, oldEditEventData?: EventOldData) => {
    const { veventComponent: newVevent } = newEditEventData;

    if (!oldEditEventData) {
        // It's a creation operation
        const newVeventWithSequence = {
            ...newVevent,
            sequence: { value: 0 },
        };
        return {
            newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
        };
    }
    const oldVevent = oldEditEventData.mainVeventComponent;
    const newVeventWithSequence = withVeventSequence(newVevent, oldVevent);
    return {
        newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
        oldEditEventData: { ...oldEditEventData },
    };
};

interface SaveRecurringEventDataArguments {
    saveType: RECURRING_TYPES;
    newEditEventData: EventNewData;
    oldEditEventData: EventOldData;
    originalEditEventData: EventOldData;
    hasModifiedRrule: boolean;
}
export const getSaveRecurringEventDataWithSequence = ({
    saveType,
    newEditEventData,
    oldEditEventData,
    originalEditEventData,
    hasModifiedRrule,
}: SaveRecurringEventDataArguments) => {
    const { veventComponent: newVevent } = newEditEventData;
    const { veventComponent: oldVevent } = oldEditEventData;
    const { veventComponent: originalVevent } = originalEditEventData;

    if (saveType === RECURRING_TYPES.ALL) {
        if (!originalVevent) {
            throw Error('Original vevent component expected');
        }
        const newVeventWithSequence = withVeventSequence(newVevent, originalVevent, hasModifiedRrule);
        return {
            newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
            oldEditEventData: { ...oldEditEventData },
            originalEditEventData: { ...originalEditEventData },
        };
    }
    if (saveType === RECURRING_TYPES.SINGLE) {
        if (!oldVevent) {
            throw Error('Old vevent component expected');
        }
        const newVeventWithSequence = withVeventSequence(newVevent, oldVevent, hasModifiedRrule);
        return {
            newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
            oldEditEventData: { ...oldEditEventData },
            originalEditEventData: { ...originalEditEventData },
        };
    }
    if (saveType === RECURRING_TYPES.FUTURE) {
        if (!oldVevent || !originalVevent) {
            throw Error('Old and original vevent components expected');
        }
        const newVeventWithSequence = withVeventSequence(newVevent, oldVevent, hasModifiedRrule);
        const originalVeventWithSequence = withIncreasedSequence(originalVevent);
        return {
            newEditEventData: { ...newEditEventData, veventComponent: newVeventWithSequence },
            oldEditEventData: { ...oldEditEventData },
            originalEditEventData: { ...originalEditEventData, veventComponent: originalVeventWithSequence },
        };
    }
    throw new Error('Unknown type');
};

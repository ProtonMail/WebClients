import { VcalVeventComponent } from '../../../interfaces/VcalModel';
import { getPropertyTzid, isIcalPropertyAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';

export enum UpdateAllPossibilities {
    KEEP_SINGLE_EDITS,
    KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
    USE_NEW_START_DATE
}

const getUpdatePossibilities = (oldVeventComponent: VcalVeventComponent, newVeventComponent: VcalVeventComponent) => {
    const oldStartTzid = getPropertyTzid(oldVeventComponent.dtstart);
    const newStartTzid = getPropertyTzid(newVeventComponent.dtstart);

    const oldIsAllDay = isIcalPropertyAllDay(oldVeventComponent.dtstart);
    const newIsAllDay = isIcalPropertyAllDay(newVeventComponent.dtstart);

    const oldLocalStart = toUTCDate(newVeventComponent.dtstart.value);
    const newLocalStart = toUTCDate(newVeventComponent.dtstart.value);

    const isSameTzid = oldStartTzid === newStartTzid;
    const isSameAllDay = oldIsAllDay === newIsAllDay;

    if (+oldLocalStart === +newLocalStart && isSameTzid && isSameAllDay) {
        // 1. Keep single edits
        // 2. Keep the start time since it's the same
        return UpdateAllPossibilities.KEEP_SINGLE_EDITS;
    }

    const oldDateTime = propertyToUTCDate(oldVeventComponent.dtstart);
    const newDateTime = propertyToUTCDate(newVeventComponent.dtstart);
    //const diff = +oldDateTime - +newDateTime;

    if (isSameDay(oldDateTime, newDateTime) && isSameAllDay) {
        // 1. Destroy single edits
        // 2. Apply the startDiff to the original event's start time
        return UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME;
    }

    // 1. Destroy single edits
    // 2. Use the new start day and start time
    return UpdateAllPossibilities.USE_NEW_START_DATE;
    /*
    const oldDateTime = toUTCDate(oldVeventComponent.dtstart.value);
    const newDateTime = toUTCDate(newVeventComponent.dtstart.value);

    const isNewAllDay = oldVeventComponent.dtstart.parameters?.type !== newVeventComponent.dtstart.parameters?.type;
    const isNewTimezone = oldVeventComponent.dtstart.parameters?.tzid !== newVeventComponent.dtstart.parameters?.tzid;
    const isNewTime = +oldDateTime !== +newDateTime;
    */
};

export default getUpdatePossibilities;

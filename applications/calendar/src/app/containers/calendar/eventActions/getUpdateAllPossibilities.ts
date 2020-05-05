import { getDateOrDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { getIsRruleEqual } from './rruleEqual';

export enum UpdateAllPossibilities {
    KEEP_SINGLE_EDITS,
    KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
    USE_NEW_START_DATE
}

const getUpdateAllPossibilities = (
    originalVeventComponent: VcalVeventComponent,
    oldVeventComponent: VcalVeventComponent,
    newVeventComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring
) => {
    // If editing a single edit, we can use the dtstart as is...
    const oldStartProperty = oldVeventComponent['recurrence-id']
        ? oldVeventComponent.dtstart
        : getDateOrDateTimeProperty(oldVeventComponent.dtstart, recurrence.localStart);
    const newStartProperty = newVeventComponent.dtstart;
    /*
    const oldIsAllDay = isIcalPropertyAllDay(oldStartProperty);
    const newIsAllDay = isIcalPropertyAllDay(newStartProperty);

    const oldStartTzid = !isIcalPropertyAllDay(oldStartProperty) ? getPropertyTzid(oldStartProperty) : undefined;
    const newStartTzid = !isIcalPropertyAllDay(newStartProperty) ? getPropertyTzid(newStartProperty) : undefined;

    const isSameTzid = oldStartTzid === newStartTzid;
    const isSameAllDay = oldIsAllDay === newIsAllDay;

    if (isSameTzid && isSameAllDay && +localStartDate === +localEndDate) {
        // Not supported because to update future events, we'd need to decrypt and resave every event
        //return UpdateAllPossibilities.KEEP_SINGLE_EDITS;
    }
    */
    const oldLocalStartDate = toUTCDate(oldStartProperty.value);
    const newLocalStartDate = toUTCDate(newStartProperty.value);

    // Try to guess if the user wants to update the first event in the occurrence.
    // If the day is the same, and the RRULE hasn't changed, then it's assumed that
    // the first occurrence should change. A better approach is probably to let the user
    // pick which event in the occurrence should be changed before we arrive here.
    if (
        isSameDay(oldLocalStartDate, newLocalStartDate) &&
        originalVeventComponent.rrule &&
        getIsRruleEqual(originalVeventComponent.rrule, newVeventComponent.rrule)
    ) {
        return UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME;
    }

    return UpdateAllPossibilities.USE_NEW_START_DATE;
};

export default getUpdateAllPossibilities;

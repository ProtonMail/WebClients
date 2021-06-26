import {
    getDateOrDateTimeProperty,
    getDtendProperty,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import { getIsAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import { addDays, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { getIsRruleEqual } from '@proton/shared/lib/calendar/rruleEqual';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';

export enum UpdateAllPossibilities {
    KEEP_SINGLE_EDITS,
    KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
    USE_NEW_START_DATE,
}

const getRecurringUpdateAllPossibilities = (
    originalVeventComponent: VcalVeventComponent,
    oldVeventComponent: VcalVeventComponent,
    newVeventComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring
) => {
    // If editing a single edit, we can use the dtstart as is...
    const oldStartProperty = oldVeventComponent['recurrence-id']
        ? oldVeventComponent.dtstart
        : getDateOrDateTimeProperty(oldVeventComponent.dtstart, recurrence.localStart);
    const modifiedLocalEnd = getIsAllDay(oldVeventComponent) ? addDays(recurrence.localEnd, +1) : recurrence.localEnd;
    const oldEndProperty = oldVeventComponent['recurrence-id']
        ? getDtendProperty(oldVeventComponent)
        : getDateOrDateTimeProperty(getDtendProperty(oldVeventComponent), modifiedLocalEnd);
    const newStartProperty = newVeventComponent.dtstart;
    const newEndProperty = getDtendProperty(newVeventComponent);
    const hasModifiedDateTimes =
        +propertyToUTCDate(oldStartProperty) !== +propertyToUTCDate(newStartProperty) ||
        +propertyToUTCDate(oldEndProperty) !== +propertyToUTCDate(newEndProperty);
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
        return {
            updateAllPossibilities: UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
            hasModifiedDateTimes,
        };
    }

    return {
        updateAllPossibilities: UpdateAllPossibilities.USE_NEW_START_DATE,
        hasModifiedDateTimes,
    };
};

export default getRecurringUpdateAllPossibilities;

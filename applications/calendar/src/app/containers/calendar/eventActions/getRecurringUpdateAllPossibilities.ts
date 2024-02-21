import { getIsRruleEqual } from '@proton/shared/lib/calendar/recurrence/rruleEqual';
import {
    getDateOrDateTimeProperty,
    getDtendProperty,
    propertyToUTCDate,
} from '@proton/shared/lib/calendar/vcalConverter';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { getIsAllDay } from '@proton/shared/lib/calendar/veventHelper';
import { addDays, isSameDay } from '@proton/shared/lib/date-fns-utc';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';

export enum UpdateAllPossibilities {
    KEEP_SINGLE_MODIFICATIONS,
    KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
    USE_NEW_START_DATE,
}

const getRecurringUpdateAllPossibilities = ({
    originalVeventComponent,
    oldVeventComponent,
    newVeventComponent,
    recurrence,
    isOrganizer,
}: {
    originalVeventComponent: VcalVeventComponent;
    oldVeventComponent: VcalVeventComponent;
    newVeventComponent: VcalVeventComponent;
    recurrence: CalendarEventRecurring;
    isOrganizer: boolean;
}) => {
    const isEditingSingleEdit = getHasRecurrenceId(oldVeventComponent);
    // If editing a single edit, we can use the dtstart as is...
    const oldStartProperty = isEditingSingleEdit
        ? oldVeventComponent.dtstart
        : getDateOrDateTimeProperty(oldVeventComponent.dtstart, recurrence.localStart);
    const modifiedLocalEnd = getIsAllDay(oldVeventComponent) ? addDays(recurrence.localEnd, +1) : recurrence.localEnd;
    const oldEndProperty = isEditingSingleEdit
        ? getDtendProperty(oldVeventComponent)
        : getDateOrDateTimeProperty(getDtendProperty(oldVeventComponent), modifiedLocalEnd);
    const newStartProperty = newVeventComponent.dtstart;
    const newEndProperty = getDtendProperty(newVeventComponent);
    const hasModifiedDateTimes =
        +propertyToUTCDate(oldStartProperty) !== +propertyToUTCDate(newStartProperty) ||
        +propertyToUTCDate(oldEndProperty) !== +propertyToUTCDate(newEndProperty);
    const isRruleEqual = getIsRruleEqual(originalVeventComponent.rrule, newVeventComponent.rrule, true);
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
    /**
     * For series with attendees and single modifications,
     * when the change is not a breaking one we want to preserve the modifications
     */
    if (isOrganizer && !hasModifiedDateTimes && isRruleEqual) {
        return {
            updateAllPossibilities: UpdateAllPossibilities.KEEP_SINGLE_MODIFICATIONS,
            hasModifiedDateTimes,
            isRruleEqual,
        };
    }

    const oldLocalStartDate = toUTCDate(oldStartProperty.value);
    const newLocalStartDate = toUTCDate(newStartProperty.value);

    // Try to guess if the user wants to update the first event in the occurrence.
    // If the day is the same, and the RRULE hasn't changed, then it's assumed that
    // the first occurrence should change. A better approach is probably to let the user
    // pick which event in the occurrence should be changed before we arrive here.
    if (isSameDay(oldLocalStartDate, newLocalStartDate) && originalVeventComponent.rrule && isRruleEqual) {
        return {
            updateAllPossibilities: UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME,
            hasModifiedDateTimes,
            isRruleEqual,
        };
    }

    return {
        updateAllPossibilities: UpdateAllPossibilities.USE_NEW_START_DATE,
        hasModifiedDateTimes,
        isRruleEqual,
    };
};

export default getRecurringUpdateAllPossibilities;

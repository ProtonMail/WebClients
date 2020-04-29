import { getDateOrDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { isSameDay } from 'proton-shared/lib/date-fns-utc';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import getHasBrokenRrule from './rruleBroken';

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
    const oldStartProperty = getDateOrDateTimeProperty(oldVeventComponent.dtstart, recurrence.localStart);
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
    const originalLocalStartDate = toUTCDate(originalVeventComponent.dtstart.value);

    if (
        isSameDay(oldLocalStartDate, newLocalStartDate) &&
        !getHasBrokenRrule(originalLocalStartDate, newVeventComponent.rrule)
    ) {
        return UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME;
    }

    return UpdateAllPossibilities.USE_NEW_START_DATE;
};

export default getUpdateAllPossibilities;

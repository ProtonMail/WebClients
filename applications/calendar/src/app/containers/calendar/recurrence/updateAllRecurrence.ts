import { omit } from 'proton-shared/lib/helpers/object';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { getSafeRruleUntil } from './helper';
import { getStartDateTimeMerged, getEndDateTimeMerged } from './getDateTimeMerged';
import { UpdateAllPossibilities } from '../eventActions/getUpdateAllPossibilities';

const getComponentWithUpdatedRrule = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring,
    isSingleEdit: boolean
) => {
    const { rrule: originalRrule } = originalComponent;

    if (!originalRrule) {
        throw new Error('Edit without an original event with recurring events');
    }

    // If this update is based on a future edit, there is no RRULE, so it will be based on the original.
    // If it's not, it'll take the "new" RRULE
    const newRrule = isSingleEdit ? originalRrule : component.rrule;

    // If the user has edited the RRULE, we'll use that.
    if (!isDeepEqual(newRrule, originalRrule)) {
        if (!newRrule) {
            return omit(component, ['rrule']);
        }
        return {
            ...component,
            rrule: newRrule
        };
    }

    if (originalRrule.value.until) {
        return {
            ...component,
            rrule: getSafeRruleUntil(originalRrule, component)
        };
    }

    return {
        ...component,
        rrule: newRrule
    };
};

interface Arguments {
    component: VcalVeventComponent;
    originalComponent: VcalVeventComponent;
    recurrence: CalendarEventRecurring;
    mode: UpdateAllPossibilities;
    isSingleEdit: boolean;
}
const updateAllRecurrence = ({ component, originalComponent, recurrence, mode, isSingleEdit }: Arguments) => {
    // Have to set the old UID (this won't be necessary until we merge chains)
    const veventWithOldUID = {
        ...component,
        uid: { value: originalComponent.uid.value }
    } as VcalVeventComponent;

    // Strip any RECURRENCE-ID when updating all events
    delete veventWithOldUID['recurrence-id'];

    if (mode === UpdateAllPossibilities.KEEP_SINGLE_EDITS) {
        // Copy over the exdates
        veventWithOldUID.exdate = originalComponent.exdate;
        // If single edits are to be kept, the start time can not change, shouldn't get here if not but just to be sure
        veventWithOldUID.dtstart = originalComponent.dtstart;
        veventWithOldUID.dtend = getEndDateTimeMerged(component.dtstart, component.dtend, veventWithOldUID.dtstart);

        return veventWithOldUID;
    }

    if (mode === UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME) {
        delete veventWithOldUID.exdate;

        const mergedDtstart = getStartDateTimeMerged(component.dtstart, originalComponent.dtstart);
        const mergedDtend = getEndDateTimeMerged(component.dtstart, component.dtend, mergedDtstart);

        veventWithOldUID.dtstart = mergedDtstart;
        veventWithOldUID.dtend = mergedDtend;

        return veventWithOldUID;
    }

    delete veventWithOldUID.exdate;

    return getComponentWithUpdatedRrule(veventWithOldUID, originalComponent, recurrence, isSingleEdit);
};

export default updateAllRecurrence;

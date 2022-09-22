import { getDtendProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { UpdateAllPossibilities } from '../eventActions/getRecurringUpdateAllPossibilities';
import { getEndDateTimeMerged, getStartDateTimeMerged } from './getDateTimeMerged';
import { getSafeRruleUntil } from './helper';

const getComponentWithUpdatedRrule = (component: VcalVeventComponent) => {
    const { rrule } = component;

    if (!rrule) {
        return omit(component, ['rrule']);
    }

    // Otherwise it's using the original rrule and we'll set a safer until value just in case the event got moved
    if (rrule.value.until) {
        return {
            ...component,
            rrule: getSafeRruleUntil(rrule, component),
        };
    }

    return {
        ...component,
        rrule,
    };
};

interface Arguments {
    component: VcalVeventComponent;
    originalComponent: VcalVeventComponent;
    mode: UpdateAllPossibilities;
    isSingleEdit: boolean;
    isAttendee: boolean;
}
const updateAllRecurrence = ({ component, originalComponent, mode, isAttendee }: Arguments): VcalVeventComponent => {
    // Have to set the old UID (this won't be necessary until we merge chains)
    const veventWithOldUID = {
        ...component,
        uid: { value: originalComponent.uid.value },
    } as VcalVeventComponent;

    // Strip any RECURRENCE-ID when updating all events
    delete veventWithOldUID['recurrence-id'];

    if (mode === UpdateAllPossibilities.KEEP_SINGLE_EDITS || isAttendee) {
        // Copy over the exdates, if any
        if (originalComponent.exdate) {
            veventWithOldUID.exdate = originalComponent.exdate;
        }
        // If single edits are to be kept, the start time can not change, shouldn't get here if not but just to be sure
        veventWithOldUID.dtstart = originalComponent.dtstart;
        veventWithOldUID.dtend = getEndDateTimeMerged(
            component.dtstart,
            getDtendProperty(component),
            veventWithOldUID.dtstart
        );

        return veventWithOldUID;
    }

    if (mode === UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME) {
        // Time changed so remove the exdate
        delete veventWithOldUID.exdate;

        const mergedDtstart = getStartDateTimeMerged(component.dtstart, originalComponent.dtstart);
        const mergedDtend = getEndDateTimeMerged(component.dtstart, getDtendProperty(component), mergedDtstart);

        veventWithOldUID.dtstart = mergedDtstart;
        veventWithOldUID.dtend = mergedDtend;

        return veventWithOldUID;
    }

    delete veventWithOldUID.exdate;

    // Date has changed here
    return getComponentWithUpdatedRrule(veventWithOldUID);
};

export default updateAllRecurrence;

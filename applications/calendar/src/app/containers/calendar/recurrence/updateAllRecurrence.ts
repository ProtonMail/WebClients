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
        ...omit(component, ['recurrence-id']),
        uid: { value: originalComponent.uid.value },
    } as VcalVeventComponent;

    if (mode === UpdateAllPossibilities.KEEP_SINGLE_EDITS || isAttendee) {
        return {
            ...veventWithOldUID,
            // If single edits are to be kept, the start time can not change, shouldn't get here if not but just to be sure
            dtstart: originalComponent.dtstart,
            dtend: getEndDateTimeMerged(component.dtstart, getDtendProperty(component), veventWithOldUID.dtstart),
            // Copy over the exdates, if any
            ...(originalComponent.exdate && { exdate: originalComponent.exdate }),
        };
    }

    if (mode === UpdateAllPossibilities.KEEP_ORIGINAL_START_DATE_BUT_USE_TIME) {
        const mergedDtstart = getStartDateTimeMerged(component.dtstart, originalComponent.dtstart);

        return {
            // Time changed so remove the exdate
            ...omit(veventWithOldUID, ['exdate']),
            dtstart: mergedDtstart,
            dtend: getEndDateTimeMerged(component.dtstart, getDtendProperty(component), mergedDtstart),
        };
    }

    // Date has changed here
    return getComponentWithUpdatedRrule(omit(veventWithOldUID, ['exdate']));
};

export default updateAllRecurrence;

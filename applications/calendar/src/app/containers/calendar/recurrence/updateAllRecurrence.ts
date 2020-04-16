import { omit } from 'proton-shared/lib/helpers/object';
import isDeepEqual from 'proton-shared/lib/helpers/isDeepEqual';
import { VcalVeventComponent } from '../../../interfaces/VcalModel';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { getSafeRruleUntil } from './helper';

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

const updateAllRecurrence = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring,
    isSingleEdit: boolean
) => {
    // Have to set the old UID (this won't be necessary until we merge chains)
    const veventWithOldUID = {
        ...component,
        uid: { value: originalComponent.uid.value }
    } as VcalVeventComponent;

    // Strip any RECURRENCE-ID when updating all events
    delete veventWithOldUID['recurrence-id'];

    /*
    if (isKeepSingleEdits) {
        veventWithOldUID.exdate = originalComponent.exdate;
        // If single edits are to be kept, the start time can not change, shouldn't get here if not but just to be sure
        veventWithOldUID.dtstart = originalComponent.dtstart;
        // TODO: What if the end time was changed though?
        // TODO: merge new end time with old end time
        veventWithOldUID.dtend = originalComponent.dtend;
    } else if (isKeepOriginalStartDate) {
        delete veventWithOldUID.exdate;
        // merge start time with original start date
        // merge end time with original end date
        veventWithOldUID.dtstart = originalComponent.dtstart;
        veventWithOldUID.dtend = originalComponent.dtend;
    } else {
        delete veventWithOldUID.exdate;
    }
     */

    return getComponentWithUpdatedRrule(veventWithOldUID, originalComponent, recurrence, isSingleEdit);
};

export default updateAllRecurrence;

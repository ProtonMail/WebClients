import { getIsAllDay, getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { fromUTCDate } from '@proton/shared/lib/date/timezone';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { toExdate } from './helper';

const createSingleRecurrence = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    localStartToExclude: Date
): VcalVeventComponent => {
    const singleExdate = toExdate(
        fromUTCDate(localStartToExclude),
        getIsAllDay(originalComponent),
        getPropertyTzid(originalComponent.dtstart)
    );

    const veventWithRecurrenceId = {
        ...component,
        'recurrence-id': singleExdate,
    };

    // Strip any RRULE when creating a single occurrence
    return omit(veventWithRecurrenceId, ['rrule', 'exdate']);
};

export default createSingleRecurrence;

import { toExdate } from '@proton/shared/lib/calendar/exdate';
import { getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import {getIsAllDay} from '@proton/shared/lib/calendar/veventHelper';
import { fromUTCDate } from '@proton/shared/lib/date/timezone';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

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

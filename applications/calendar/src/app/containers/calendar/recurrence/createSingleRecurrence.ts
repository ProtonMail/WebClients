import { getPropertyTzid, isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { fromUTCDate } from 'proton-shared/lib/date/timezone';
import { omit } from 'proton-shared/lib/helpers/object';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { toExdate } from './helper';

const createSingleRecurrence = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    localStartToExclude: Date
): VcalVeventComponent => {
    const singleExdate = toExdate(
        fromUTCDate(localStartToExclude),
        isIcalAllDay(originalComponent),
        getPropertyTzid(originalComponent.dtstart)
    );

    const veventWithRecurrenceId = {
        ...component,
        'recurrence-id': singleExdate
    } as VcalVeventComponent;

    // Strip any RRULE when creating a single occurrence
    return omit(veventWithRecurrenceId, ['rrule', 'exdate']);
};

export default createSingleRecurrence;

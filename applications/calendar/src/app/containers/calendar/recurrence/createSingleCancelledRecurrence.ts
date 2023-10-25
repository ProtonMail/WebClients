import { ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { withIncrementedSequence } from '../eventActions/sequence';

const createSingleCancelledRecurrence = (component: VcalVeventComponent): VcalVeventComponent => {
    const veventWithRecurrenceId: VcalVeventComponent = withIncrementedSequence({
        ...component,
        'recurrence-id': { ...component.dtstart },
        status: { value: ICAL_EVENT_STATUS.CANCELLED },
    });

    return omit(veventWithRecurrenceId, ['rrule', 'exdate']);
};

export default createSingleCancelledRecurrence;

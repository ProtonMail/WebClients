import { ICAL_EVENT_STATUS } from '@proton/shared/lib/calendar/constants';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { withIncrementedSequence } from '../eventActions/sequence';

const createSingleCancelledRecurrence = (component: VcalVeventComponent): VcalVeventComponent => {
    return withIncrementedSequence({
        ...component,
        'recurrence-id': { ...component.dtstart },
        status: { value: ICAL_EVENT_STATUS.CANCELLED },
    });
};

export default createSingleCancelledRecurrence;

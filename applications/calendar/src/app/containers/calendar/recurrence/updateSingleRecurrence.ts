import { omit } from '@proton/shared/lib/helpers/object';
import type { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

const updateSingleRecurrence = (component: VcalVeventComponent): VcalVeventComponent => {
    return omit(component, ['rrule', 'exdate']);
};

export default updateSingleRecurrence;

import { omit } from 'proton-shared/lib/helpers/object';
import { VcalVeventComponent } from '../../../interfaces/VcalModel';

const updateSingleRecurrence = (component: VcalVeventComponent): VcalVeventComponent => {
    return omit(component, ['rrule', 'exdate']);
};

export default updateSingleRecurrence;

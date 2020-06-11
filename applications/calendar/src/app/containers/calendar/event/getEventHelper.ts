import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { getRecurrenceId } from 'proton-shared/lib/calendar/vcalHelper';

export const getRecurrenceIdDate = (component: VcalVeventComponent) => {
    const rawRecurrenceId = getRecurrenceId(component);
    if (!rawRecurrenceId || !rawRecurrenceId.value) {
        return;
    }
    return toUTCDate(rawRecurrenceId.value);
};

export const getUid = (component: VcalVeventComponent) => {
    return component.uid.value;
};

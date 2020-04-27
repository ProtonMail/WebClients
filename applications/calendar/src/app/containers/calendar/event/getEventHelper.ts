import { getIcalRecurrenceId } from 'proton-shared/lib/calendar/recurring';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

export const getRecurrenceId = (component: VcalVeventComponent) => {
    const rawRecurrenceId = getIcalRecurrenceId(component);
    if (!rawRecurrenceId || !rawRecurrenceId.value) {
        return;
    }
    return toUTCDate(rawRecurrenceId.value);
};

export const getUid = (component: VcalVeventComponent) => {
    return component.uid.value;
};

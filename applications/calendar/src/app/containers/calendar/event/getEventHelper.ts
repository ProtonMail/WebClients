import { getRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

export const getRecurrenceIdDate = (component: VcalVeventComponent) => {
    const rawRecurrenceId = getRecurrenceId(component);
    if (!rawRecurrenceId || !rawRecurrenceId.value) {
        return;
    }
    return toUTCDate(rawRecurrenceId.value);
};

export const getUidValue = (component: VcalVeventComponent) => {
    return component.uid.value;
};

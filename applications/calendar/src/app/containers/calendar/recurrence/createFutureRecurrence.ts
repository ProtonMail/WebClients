import { getSupportedUID } from '@proton/shared/lib/calendar/helper';
import { getIsAllDay } from '@proton/shared/lib/calendar/vcalHelper';
import { omit } from '@proton/shared/lib/helpers/object';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { getSafeRruleCount, getSafeRruleUntil } from './helper';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';

const getRecurrenceOffsetID = (date: Date, isAllDay: boolean) => {
    const dateString = [date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()]
        .map((n) => `${n}`.padStart(2, '0'))
        .join('');
    const timeString = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
        .map((n) => `${n}`.padStart(2, '0'))
        .join('');
    return isAllDay ? `R${dateString}` : `R${dateString}T${timeString}`;
};

const getComponentWithUpdatedRrule = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring
): VcalVeventComponent => {
    const { rrule: originalRrule } = originalComponent;
    const { rrule: newRrule } = component;

    if (!originalRrule) {
        throw new Error('Original RRULE undefined');
    }

    if (!newRrule) {
        return omit(component, ['rrule']);
    }

    // Count was not changed, so set a new count based on this occurrence
    if (newRrule.value.count && originalRrule.value.count === newRrule.value.count) {
        const newCount = newRrule.value.count - (recurrence.occurrenceNumber - 1);
        const safeRrule = getSafeRruleCount(newRrule, newCount);
        if (!safeRrule) {
            return omit(component, ['rrule']);
        }
        return { ...component, rrule: safeRrule };
    }

    if (newRrule.value.until) {
        return {
            ...component,
            rrule: getSafeRruleUntil(newRrule, component),
        };
    }

    return {
        ...component,
        rrule: newRrule,
    };
};

export const getFutureRecurrenceUID = (oldUID: string, localStart: Date, isAllDay: boolean) => {
    const offset = getRecurrenceOffsetID(localStart, isAllDay);
    const endIndex = oldUID.lastIndexOf('@');
    const pre = endIndex === -1 ? oldUID : oldUID.slice(0, endIndex);
    const post = endIndex === -1 ? '' : oldUID.slice(endIndex);
    // we remove any possible previous recurrence offsets (we match our own type of offset)
    const cleanPre = pre.replace(/(?:_R\d{8}(?:T\d{6})?)+$/, '');
    return getSupportedUID(`${cleanPre}_${offset}${post}`);
};

const createFutureRecurrence = (
    component: VcalVeventComponent,
    originalComponent: VcalVeventComponent,
    recurrence: CalendarEventRecurring
) => {
    const veventWithNewUID = {
        ...component,
        uid: {
            value: getFutureRecurrenceUID(
                originalComponent.uid.value,
                recurrence.localStart,
                getIsAllDay(originalComponent)
            ),
        },
    };

    const veventStripped = omit(veventWithNewUID, ['recurrence-id', 'exdate']);

    return getComponentWithUpdatedRrule(veventStripped, originalComponent, recurrence);
};

export default createFutureRecurrence;

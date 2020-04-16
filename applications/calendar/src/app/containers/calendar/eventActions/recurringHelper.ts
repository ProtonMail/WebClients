import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { getIcalRecurrenceId, getOccurrences } from 'proton-shared/lib/calendar/recurring';
import { toUTCDate } from 'proton-shared/lib/date/timezone';
import parseMainEventData from '../event/parseMainEventData';
import { VcalVeventComponent } from '../../../interfaces/VcalModel';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';

export const getOriginalEvent = (recurrences: CalendarEvent[]) => {
    return recurrences.find((Event) => {
        const component = parseMainEventData(Event);
        if (!component) {
            return false;
        }
        return !getIcalRecurrenceId(component);
    });
};

export const getRecurrenceEvents = (recurrences: CalendarEvent[], originalEvent: CalendarEvent) => {
    return recurrences.filter((Event) => Event !== originalEvent);
};

export const getRecurrenceEventsAfter = (recurrences: CalendarEvent[], date: Date) => {
    return recurrences.filter((Event) => {
        const component = parseMainEventData(Event);
        if (!component) {
            return false;
        }
        const rawRecurrenceId = getIcalRecurrenceId(component);
        if (!rawRecurrenceId || !rawRecurrenceId.value) {
            return false;
        }
        const recurrenceId = toUTCDate(rawRecurrenceId.value);
        return recurrenceId >= date;
    });
};

export const getHasFutureOption = (
    veventComponent: VcalVeventComponent | undefined,
    recurrence: CalendarEventRecurring
) => {
    if (!veventComponent || recurrence.occurrenceNumber === 1) {
        return false;
    }

    // Dry-run delete this and future recurrences
    const veventFutureDeleted = deleteFutureRecurrence(
        veventComponent,
        recurrence.localStart,
        recurrence.occurrenceNumber
    );

    // If we would end up with at least 1 occurrence, the delete this and future option is allowed
    return getOccurrences({ component: veventFutureDeleted, maxCount: 2 }).length >= 1;
};

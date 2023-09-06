import {getIsAllDay, getRecurrenceId} from '@proton/shared/lib/calendar/veventHelper';
import { addDays } from 'date-fns';

import { toExdate } from '@proton/shared/lib/calendar/exdate';
import { getOccurrences } from '@proton/shared/lib/calendar/recurrence/recurring';
import { getDtendProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { getPropertyTzid } from '@proton/shared/lib/calendar/vcalHelper';
import { fromUTCDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { VcalDateOrDateTimeProperty, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import parseMainEventData from '../event/parseMainEventData';
import deleteFutureRecurrence from '../recurrence/deleteFutureRecurrence';

export const getOriginalEvent = (recurrences: CalendarEvent[]) => {
    return recurrences.find((Event) => {
        const component = parseMainEventData(Event);
        if (!component) {
            return false;
        }
        return !getRecurrenceId(component);
    });
};

export const getCurrentEvent = (
    originalComponent: VcalVeventComponent,
    recurrence: Pick<CalendarEventRecurring, 'localStart' | 'localEnd'>
) => {
    const isAllDay = getIsAllDay(originalComponent);
    const { localStart, localEnd } = recurrence;
    const correctedLocalEnd = isAllDay ? addDays(localEnd, 1) : localEnd;
    const recurrenceDtstart = toExdate(fromUTCDate(localStart), isAllDay, getPropertyTzid(originalComponent.dtstart));
    const recurrenceDtend = toExdate(
        fromUTCDate(correctedLocalEnd),
        isAllDay,
        getPropertyTzid(getDtendProperty(originalComponent))
    );

    return {
        ...originalComponent,
        dtstart: recurrenceDtstart,
        dtend: recurrenceDtend,
    };
};

export const getRecurrenceEvents = (recurrences: CalendarEvent[], originalEvent: CalendarEvent) => {
    return recurrences.filter((Event) => Event.ID !== originalEvent.ID);
};

export const getExdatesAfter = (exdates: VcalDateOrDateTimeProperty[], date: Date) => {
    if (!Array.isArray(exdates)) {
        return [];
    }
    return exdates.filter((exdate) => {
        const recurrenceId = toUTCDate(exdate.value);
        return recurrenceId >= date;
    });
};

export const getRecurrenceEventsAfter = (recurrences: CalendarEvent[], date: Date) => {
    return recurrences.filter((Event) => {
        const component = parseMainEventData(Event);
        if (!component) {
            return false;
        }
        const rawRecurrenceId = getRecurrenceId(component);
        if (!rawRecurrenceId || !rawRecurrenceId.value) {
            return false;
        }
        const recurrenceId = toUTCDate(rawRecurrenceId.value);
        return recurrenceId >= date;
    });
};

export const getHasFutureOption = (veventComponent: VcalVeventComponent, recurrence: CalendarEventRecurring) => {
    if (recurrence.occurrenceNumber === 1) {
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

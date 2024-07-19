import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../../containers/calendar/interface';
import type { LayoutEvent } from '../layout';

export const getEvent = (
    idx: number,
    eventsInRow: LayoutEvent[],
    events: (CalendarViewEvent | CalendarViewBusyEvent)[]
) => {
    const { idx: eventIdx } = eventsInRow[idx];
    return events[eventIdx];
};
